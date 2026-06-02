/**
 * Tests unitaires — apiClient (httpClient + helpers)
 *
 * On vérifie :
 *  - credentials: "include" sur tous les appels
 *  - Absence du header Authorization (token en cookie httpOnly)
 *  - Header X-Tenant-ID conditionnel
 *  - Préfixage correct des URLs
 *  - Gestion du 401 : clearAuth + propagation d'erreur
 *  - resolveLoginPath : logique de redirection pure
 *  - Les helpers apiGet / apiPost / apiPut / apiDelete
 *
 * @jest-environment jsdom
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
// IMPORTANT : jest.mock() est hoisté avant les déclarations de variables.
// On utilise jest.fn() INLINE dans la factory, puis jest.mocked() après import.

jest.mock("react-admin", () => ({
  fetchUtils: { fetchJson: jest.fn() },
}));

jest.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: { getState: jest.fn() },
}));

jest.mock("@/shared/stores/tenant.store", () => ({
  useTenantStore: { getState: jest.fn() },
}));

import { fetchUtils } from "react-admin";
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

const mockFetchJson = jest.mocked(fetchUtils.fetchJson);
const mockAuthGetState = jest.mocked(useAuthStore.getState);
const mockTenantGetState = jest.mocked(useTenantStore.getState);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockClearAuth = jest.fn();

function setupMocks(tenant: { id: string; slug: string } | null = null) {
  mockAuthGetState.mockReturnValue({ clearAuth: mockClearAuth } as ReturnType<
    typeof useAuthStore.getState
  >);
  mockTenantGetState.mockReturnValue({ tenant } as ReturnType<
    typeof useTenantStore.getState
  >);
}

// ─── resolveLoginPath (pure function) ─────────────────────────────────────────

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
    mockFetchJson.mockResolvedValue({ json: {}, status: 200 });
    setupMocks();
  });

  // ── credentials ────────────────────────────────────────────────────────────

  it('utilise credentials: "include" sur chaque requête', async () => {
    await httpClient("/api/test");
    const [, opts] = mockFetchJson.mock.calls[0];
    expect(opts.credentials).toBe("include");
  });

  // ── Authorization ──────────────────────────────────────────────────────────

  it("n'ajoute pas de header Authorization (token en cookie)", async () => {
    await httpClient("/api/test");
    const [, opts] = mockFetchJson.mock.calls[0];
    const headers = opts.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  // ── X-Tenant-ID ────────────────────────────────────────────────────────────

  it("n'envoie pas X-Tenant-ID si aucun tenant", async () => {
    setupMocks(null);
    await httpClient("/api/test");
    const [, opts] = mockFetchJson.mock.calls[0];
    expect((opts.headers as Headers).has("X-Tenant-ID")).toBe(false);
  });

  it("envoie X-Tenant-ID quand un tenant est présent", async () => {
    setupMocks({ id: "tenant-1", slug: "acme" });
    await httpClient("/api/test");
    const [, opts] = mockFetchJson.mock.calls[0];
    expect((opts.headers as Headers).get("X-Tenant-ID")).toBe("tenant-1");
  });

  // ── URL prefixing ──────────────────────────────────────────────────────────

  it("préfixe un chemin relatif par /api/", async () => {
    await httpClient("auth/login");
    const [url] = mockFetchJson.mock.calls[0];
    expect(url).toBe("/api/auth/login");
  });

  it("ne double pas le préfixe /api/", async () => {
    await httpClient("/api/auth/login");
    const [url] = mockFetchJson.mock.calls[0];
    expect(url).toBe("/api/auth/login");
  });

  it("laisse passer les URL absolues intactes", async () => {
    await httpClient("http://cdn.example.com/file");
    const [url] = mockFetchJson.mock.calls[0];
    expect(url).toBe("http://cdn.example.com/file");
  });

  // ── Gestion 401 ────────────────────────────────────────────────────────────
  // window.location.replace est read-only dans jsdom ; la logique de calcul
  // du chemin de redirection est testée séparément via resolveLoginPath().

  describe("sur une réponse 401", () => {
    const err401 = Object.assign(new Error("Unauthorized"), { status: 401 });

    it("appelle clearAuth", async () => {
      mockFetchJson.mockRejectedValue(err401);
      await expect(httpClient("/api/me")).rejects.toThrow();
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
    });

    it("propage l'erreur après clearAuth", async () => {
      mockFetchJson.mockRejectedValue(err401);
      await expect(httpClient("/api/me")).rejects.toMatchObject({
        status: 401,
      });
    });

    it("clearAuth n'est pas appelé pour une 200", async () => {
      mockFetchJson.mockResolvedValue({ json: {}, status: 200 });
      await httpClient("/api/me");
      expect(mockClearAuth).not.toHaveBeenCalled();
    });
  });

  it("laisse passer les erreurs non-401 sans toucher au store", async () => {
    const err500 = Object.assign(new Error("Server Error"), { status: 500 });
    mockFetchJson.mockRejectedValue(err500);
    await expect(httpClient("/api/test")).rejects.toThrow("Server Error");
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it("laisse passer les erreurs sans status sans toucher au store", async () => {
    mockFetchJson.mockRejectedValue(new Error("Network Error"));
    await expect(httpClient("/api/test")).rejects.toThrow("Network Error");
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
    mockFetchJson.mockResolvedValue({ json: { id: 1 } });
    const result = await apiGet<{ id: number }>("resource/1");
    expect(result).toEqual({ id: 1 });
  });

  it("construit l'URL correctement", async () => {
    mockFetchJson.mockResolvedValue({ json: {} });
    await apiGet("resource/1");
    const [url] = mockFetchJson.mock.calls[0];
    expect(url).toBe("/api/resource/1");
  });
});

describe("apiPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    mockFetchJson.mockResolvedValue({ json: { ok: true } });
  });

  it("appelle fetchJson avec method POST", async () => {
    await apiPost("resource", { name: "test" });
    const [, opts] = mockFetchJson.mock.calls[0];
    expect(opts.method).toBe("POST");
  });

  it("sérialise le body en JSON", async () => {
    await apiPost("resource", { name: "test" });
    const [, opts] = mockFetchJson.mock.calls[0];
    expect(opts.body).toBe(JSON.stringify({ name: "test" }));
  });

  it("fonctionne sans body (logout, etc.)", async () => {
    await expect(apiPost("auth/logout")).resolves.not.toThrow();
  });
});

describe("apiPut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    mockFetchJson.mockResolvedValue({ json: {} });
  });

  it("appelle fetchJson avec method PUT", async () => {
    await apiPut("resource/1", { name: "updated" });
    const [, opts] = mockFetchJson.mock.calls[0];
    expect(opts.method).toBe("PUT");
  });
});

describe("apiDelete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
    mockFetchJson.mockResolvedValue({ json: {} });
  });

  it("appelle fetchJson avec method DELETE", async () => {
    await apiDelete("resource/1");
    const [, opts] = mockFetchJson.mock.calls[0];
    expect(opts.method).toBe("DELETE");
  });

  it("ne retourne rien (void)", async () => {
    const result = await apiDelete("resource/1");
    expect(result).toBeUndefined();
  });
});
