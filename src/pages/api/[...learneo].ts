import type { NextApiRequest, NextApiResponse } from "next";
import { Agent, fetch as undiciFetch } from "undici";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://localhost:4000";
const IS_DEV = process.env.NODE_ENV !== "production";
const INSECURE_TLS = process.env.INSECURE_TLS === "1";

const agent = new Agent({
  connect: { rejectUnauthorized: !(IS_DEV && INSECURE_TLS) },
});

const SKIP_HEADERS = new Set([
  "host",
  "connection",
  "transfer-encoding",
  "content-length",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const destPath = req.url!.replace(/^\/api/, "");
  const destUrl = `${BACKEND_BASE}${destPath}`;

  const reqHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!SKIP_HEADERS.has(k.toLowerCase()) && v) {
      reqHeaders[k] = Array.isArray(v) ? v.join(", ") : v;
    }
  }

  // Forward original host so Laravel can resolve the tenant via X-Forwarded-Host.
  // If already set upstream (e.g. by Caddy), keep the upstream value.
  if (!reqHeaders["x-forwarded-host"] && req.headers["host"]) {
    reqHeaders["x-forwarded-host"] = req.headers["host"];
  }

  const hasBody = !["GET", "HEAD"].includes(req.method ?? "GET");
  const body = hasBody && req.body ? JSON.stringify(req.body) : undefined;
  if (body) reqHeaders["content-type"] = "application/json";

  let attempt = 0;
  while (attempt < 3) {
    try {
      const response = await undiciFetch(destUrl, {
        method: req.method,
        headers: reqHeaders,
        body,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dispatcher: agent as any,
      });

      if ([502, 503, 504].includes(response.status) && attempt < 2) {
        attempt++;
        await new Promise((r) => setTimeout(r, 200 * attempt));
        continue;
      }

      const text = await response.text();
      res.status(response.status).send(text);
      return;
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ECONNRESET" && attempt < 2) {
        attempt++;
        continue;
      }
      res.status(502).json({ message: "Backend unreachable" });
      return;
    }
  }
}

export const config = { api: { bodyParser: true } };
