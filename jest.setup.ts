/**
 * jest.setup.ts
 *
 * S'exécute après l'installation du framework Jest (setupFilesAfterEnv).
 * Étend les matchers de `expect` avec les assertions DOM de @testing-library.
 *
 * Exemples de matchers ajoutés :
 *   expect(element).toBeInTheDocument()
 *   expect(element).toBeVisible()
 *   expect(element).toHaveValue("...")
 *   expect(element).toBeDisabled()
 */
import '@testing-library/jest-dom';

// ResizeObserver utilisé par Radix UI
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// jsdom n'implémente ni l'API Pointer Capture ni scrollIntoView, dont Radix Select
// a besoin pour ouvrir son menu et y déplacer le focus.
Element.prototype.hasPointerCapture ??= jest.fn(() => false);
Element.prototype.setPointerCapture ??= jest.fn();
Element.prototype.releasePointerCapture ??= jest.fn();
Element.prototype.scrollIntoView ??= jest.fn();
