/**
 * Tests unitaires — apiClient (httpClient + helpers)
 *
 * @jest-environment jsdom
 */

jest.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock("@/shared/stores/tenant.store", () => ({
  useTenantStore: { getState: jest.fn() },
}));

import { useAuthStore } from "@/shared/stores/auth.store";
import { useTenantStore } from "@/shared/stores/tenant.store";
import {
  httpClient,
  resolveLoginPath,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../apiClient";

const mockAuthGetState = jest.mocked(useAuthStore.getState);
const mockTenantGetState = jest.mocked(useTenantStore.getState);
const mockClearAuth = jest.fn();

// ─── Helper : crée une Response native mockée ──────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  const json = JSON.stringify(body);
  const res = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    text: jest.fn().mockResolvedValue(json),
  };
  global.fetch = jest.fn().mockResolvedValue(res);
  return res;
}

function mockFetchError(status: number) {
  const res = {
    ok: false,
    status,
    statusText: `Error ${status}`,
    headers: new Headers(),
    text: jest.fn().mockResolvedValue(""),
  };
  global.fetch = jest.fn().mockResolvedValue(res);
  return res;
}

function setupMocks(tenant: { id: string; slug: string } | null = null) {
  mockAuthGetState.mockReturnValue({ clearAuth: mockClearAuth } as ReturnType<
    typeof useAuthStore.getState
  >);
  mockTenantGetState.mockReturnValue({ tenant } as ReturnType<
    typeof useTenantStore.getState
  >);
}

// ─── resolveLoginPath ─────────────────────────────────────────────────────────

describe("resolveLoginPath", () => {
  it("retourne /login pour un chemin de portail", () => {
    expect(resolveLoginPath("/dashboard")).toBe("/login");
    expect(resolveLoginPath("/courses/intro")).toBe("/login");
    expect(resolveLoginPath("/")).toBe("/login");
  });

  it("retourne /admin/login pour un chemin admin", () => {
    expect(resolveLoginPath("/admin/users")).toBe("/admin/login");
    expect(resolveLoginPath("/admin")).toBe("/admin/login");
    expect(resolveLoginPath("/admin/courses/edit")).toBe("/admin/login");
  });
});

// ─── httpClient ───────────────────────────────────────────────────────────────

describe("httpClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    mockFetch({});
  });

  it('utilise credentials: "include" sur chaque requête', async () => {
    await httpClient("/api/test");
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.credentials).toBe("include");
  });

  it("n'ajoute pas de header Authorization (token en cookie)", async () => {
    await httpClient("/api/test");
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = opts.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("n'envoie pas X-Tenant-ID si aucun tenant", async () => {
    setupMocks(null);
    await httpClient("/api/test");
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect((opts.headers as Headers).has("X-Tenant-ID")).toBe(false);
  });

  it("envoie X-Tenant-ID quand un tenant est présent", async () => {
    setupMocks({ id: "tenant-1", slug: "acme" });
    await httpClient("/api/test");
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect((opts.headers as Headers).get("X-Tenant-ID")).toBe("tenant-1");
  });

  it("préfixe un chemin relatif par /api/", async () => {
    await httpClient("auth/login");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/v1/auth/login");
  });

  it("ne double pas le préfixe /api/", async () => {
    await httpClient("/api/v1/auth/login");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/v1/auth/login");
  });

  it("laisse passer les URL absolues intactes", async () => {
    await httpClient("http://cdn.example.com/file");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://cdn.example.com/file");
  });

  describe("sur une réponse 401", () => {
    beforeEach(() => {
      // window.location.replace() est read-only dans jsdom et déclenche
      // "not implemented: navigation" — on silences ces warnings car
      // les assertions portent uniquement sur clearAuth, pas sur la navigation.
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("appelle clearAuth", async () => {
      mockFetchError(401);
      await expect(httpClient("/api/me")).rejects.toBeDefined();
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
    });

    it("propage l'erreur après clearAuth", async () => {
      mockFetchError(401);
      await expect(httpClient("/api/me")).rejects.toMatchObject({
        status: 401,
      });
    });

    it("clearAuth n'est pas appelé pour une 200", async () => {
      mockFetch({ ok: true });
      await httpClient("/api/me");
      expect(mockClearAuth).not.toHaveBeenCalled();
    });
  });

  it("laisse passer les erreurs 500 sans toucher au store", async () => {
    mockFetchError(500);
    await expect(httpClient("/api/test")).rejects.toMatchObject({
      status: 500,
    });
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});

// ─── Helpers REST ─────────────────────────────────────────────────────────────

describe("apiGet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("retourne le JSON parsé", async () => {
    mockFetch({ id: 1 });
    const result = await apiGet<{ id: number }>("resource/1");
    expect(result).toEqual({ id: 1 });
  });

  it("construit l'URL correctement", async () => {
    mockFetch({});
    await apiGet("resource/1");
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/v1/resource/1");
  });
});

describe("apiPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("envoie la méthode POST", async () => {
    mockFetch({ created: true });
    await apiPost("resource", { name: "test" });
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.method).toBe("POST");
  });

  it("sérialise le body en JSON", async () => {
    mockFetch({});
    await apiPost("resource", { name: "test" });
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.body).toBe(JSON.stringify({ name: "test" }));
  });
});

describe("apiPut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("envoie la méthode PUT", async () => {
    mockFetch({});
    await apiPut("resource/1", { name: "updated" });
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.method).toBe("PUT");
  });
});

describe("apiDelete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it("envoie la méthode DELETE", async () => {
    mockFetch({});
    await apiDelete("resource/1");
    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(opts.method).toBe("DELETE");
  });
});
