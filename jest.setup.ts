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
import "@testing-library/jest-dom";

// ResizeObserver utilisé par Radix UI
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
