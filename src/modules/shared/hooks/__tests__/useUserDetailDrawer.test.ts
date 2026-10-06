import { act, renderHook } from '@testing-library/react';
import { useUserDetailDrawer } from '../useUserDetailDrawer';

const PATH = '/users';

function drawers() {
  const trainee = renderHook(() => useUserDetailDrawer(PATH, 'trainee'));
  const manager = renderHook(() => useUserDetailDrawer(PATH, 'manager'));
  return { trainee, manager };
}

describe('useUserDetailDrawer', () => {
  beforeEach(() => window.history.replaceState(null, '', PATH));
  afterEach(() => {
    jest.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('lit la cible depuis l’URL et reste actif malgré un slash final', () => {
    window.history.replaceState(null, '', '/users/?trainee=user-1');
    const { trainee, manager } = drawers();
    expect(trainee.result.current.id).toBe('user-1');
    expect(manager.result.current.id).toBeNull();
  });

  it('n’ouvre qu’une cible quand l’URL en contient deux', () => {
    window.history.replaceState(null, '', '/users?trainee=user-1&manager=user-2');
    const { trainee, manager } = drawers();
    expect(trainee.result.current.id).toBeNull();
    expect(manager.result.current.id).toBe('user-2');
  });

  it('remplace la cible précédente au lieu de cumuler les paramètres', () => {
    const { trainee, manager } = drawers();
    act(() => trainee.result.current.open('user-1'));
    act(() => manager.result.current.open('user-2'));
    expect(window.location.search).toBe('?manager=user-2');
    expect(trainee.result.current.id).toBeNull();
    expect(manager.result.current.id).toBe('user-2');
  });

  it('ne ferme pas la cible d’un autre type', () => {
    const { trainee, manager } = drawers();
    act(() => manager.result.current.open('user-2'));
    act(() => trainee.result.current.close());
    expect(window.location.search).toBe('?manager=user-2');
    expect(manager.result.current.id).toBe('user-2');
  });

  it('revient en arrière plutôt que d’empiler une entrée identique', () => {
    window.history.replaceState(null, '', `${PATH}?page=2`);
    const { trainee } = drawers();
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => {});
    act(() => trainee.result.current.open('user-1'));
    act(() => trainee.result.current.close());
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it('nettoie l’URL quand l’entrée n’a pas été poussée par la liste', () => {
    window.history.replaceState(null, '', `${PATH}?page=2&trainee=user-1`);
    const { trainee } = drawers();
    act(() => trainee.result.current.close());
    expect(window.location.search).toBe('?page=2');
    expect(trainee.result.current.id).toBeNull();
  });

  it('débloque la fermeture si le retour arrière ne produit aucun popstate', () => {
    jest.useFakeTimers();
    const { trainee } = drawers();
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => {});
    act(() => trainee.result.current.open('user-1'));
    act(() => trainee.result.current.close());
    act(() => trainee.result.current.close());
    expect(back).toHaveBeenCalledTimes(1);
    act(() => jest.runAllTimers());
    act(() => trainee.result.current.close());
    expect(back).toHaveBeenCalledTimes(2);
    back.mockRestore();
  });
});
