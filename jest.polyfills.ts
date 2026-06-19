/**
 * jest.polyfills.ts
 *
 * S'exécute via `setupFiles` — AVANT l'installation du framework Jest et de
 * jsdom. Injecte les APIs Web manquantes dans l'environnement Node.js de Jest,
 * nécessaires pour des packages tiers (react-router, undici…) qui présupposent
 * un runtime navigateur ou Node 18+ complet.
 */
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream, TransformStream } from "stream/web";

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  TransformStream,
});
