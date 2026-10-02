import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/admin/login',
  '/forgot-password',
  '/reset-password',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/tenant-not-found',
  '/tenant-inactive',
];
// Fichiers servis depuis public/ : les exclure de la redirection vers /login.
// Sans `/assets`, une image de public/assets répondait la page de login dès que
// le cookie manquait ou expirait, ce qui s'affiche comme une image cassée.
const STATIC_PATHS = ['/_next', '/favicon.ico', '/public', '/logo.png', '/assets', '/simulation'];

// e.g. "learneo.local" in dev, "learneo.dev-test2.nacre-solutions.com" in staging
const BASE_DOMAIN = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'localhost').split(':')[0];

/**
 * Returns the tenant slug from the host, or null when on the central domain.
 * acme.learneo.local  → "acme"
 * learneo.local       → null  (central domain)
 * localhost           → null  (central domain)
 */
function extractTenantSlug(host: string): string | null {
  const clean = host.split(':')[0];

  if (clean === BASE_DOMAIN) return null;

  if (clean.endsWith(`.${BASE_DOMAIN}`)) {
    const slug = clean.slice(0, -`.${BASE_DOMAIN}`.length);
    return slug || null;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  if (STATIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const slug = extractTenantSlug(host);
  const headers = new Headers(req.headers);

  if (slug) {
    headers.set('x-tenant-slug', slug);
  } else {
    headers.delete('x-tenant-slug');
  }

  const token = req.cookies.get('auth_token')?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isPublic && !token) {
    const isAdminPath = pathname.startsWith('/admin');
    const loginPath = isAdminPath ? '/admin/login' : '/login';
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
