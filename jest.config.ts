import type { Config } from 'jest';
import nextJest from 'next/jest.js';

/**
 * next/jest injecte automatiquement :
 *  - le transform SWC (TypeScript, JSX, module CSS…)
 *  - les moduleNameMapper depuis tsconfig.json `paths`
 *  - les mocks pour next/image, next/font, etc.
 */
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',

  // Environnement jsdom pour tous les tests React côté client.
  // Ajouter `@jest-environment node` en docblock pour les tests server-only.
  testEnvironment: 'jest-environment-jsdom',

  // Polyfills natifs Node.js (TextEncoder, TextDecoder, fetch…) avant le chargement
  // de jsdom — nécessaires pour certains packages tiers (react-router, undici…).
  setupFiles: ['<rootDir>/jest.polyfills.ts'],

  // Fichier exécuté après le chargement du framework de test (extend matchers).
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Résolution explicite des alias TypeScript (next/jest les lit depuis tsconfig,
  // mais on les déclare ici pour garantir leur présence avec Jest 30).
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },

  // Exclure node_modules SAUF les packages ESM-only qui doivent être
  // transpilés par le SWC de next/jest (ex: react-hotkeys-hook).
  transformIgnorePatterns: ['/node_modules/(?!(react-hotkeys-hook)/)', '/.next/'],

  // Patterns de fichiers de test acceptés
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // Exclure node_modules et le dossier de build
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

  // Rapport de couverture
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
};

export default createJestConfig(config);
