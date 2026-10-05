/** @jest-environment node */
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('Accès au logo de repli', () => {
  it('sert le logo par défaut sans session ni redirection vers la connexion', () => {
    const response = middleware(new NextRequest('https://tenant.example.test/logo-default.svg'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });

  it.each(['/dashboard', '/admin/programs', '/logo-default.svg/private'])(
    'conserve la protection des autres pages : %s',
    (path) => {
      const response = middleware(new NextRequest(`https://tenant.example.test${path}`));

      expect(response.status).toBe(307);
      const target = new URL(response.headers.get('location')!);
      expect(target.pathname).toBe(path.startsWith('/admin') ? '/admin/login' : '/login');
      expect(target.searchParams.get('from')).toBe(path);
    },
  );
});
