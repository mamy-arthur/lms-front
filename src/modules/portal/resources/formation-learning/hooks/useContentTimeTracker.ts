import { useEffect, useRef } from 'react';
import { portalContentTimeApi } from '@/shared/api/portal.api';

/** Au-delà, on considère l'apprenant parti et le chrono se met en pause. */
const IDLE_MS = 60_000;
/** Sauvegarde périodique : c'est le filet contre les fermetures brutales d'onglet. */
const FLUSH_INTERVAL_MS = 30_000;
/** Fréquence de contrôle de l'inactivité. Pas besoin de plus fin : le seuil est à 60 s. */
const IDLE_CHECK_INTERVAL_MS = 5_000;
/** En deçà, la période n'est pas envoyée : elle n'apprend rien et pollue les analyses. */
const MIN_REPORTABLE_MS = 1_000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

/**
 * `crypto.randomUUID` n'existe qu'en contexte sécurisé. Le portail tourne en
 * HTTPS partout, y compris en local derrière Caddy, mais un repli évite un crash
 * dur si quelqu'un ouvre l'app en http:// — et la route backend exige un UUID
 * valide, donc le repli doit en produire un vrai.
 */
function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface Options {
  enrollmentId: string | null;
  courseId: string | null;
  entryId: string | null;
  /**
   * `false` pour les contenus en iframe (SCORM) : nos écouteurs ne voient pas
   * les interactions à l'intérieur du cadre, donc la détection d'inactivité
   * mettrait le chrono en pause alors que l'apprenant travaille. Pour ces
   * contenus, seule la visibilité de l'onglet fait foi.
   */
  idleDetection: boolean;
}

/**
 * Mesure le temps réellement passé sur un contenu et l'envoie au backend.
 *
 * Une « période de consultation » = une ligne en base, identifiée par un UUID
 * généré ici. Tant que la période est ouverte, chaque sauvegarde réémet le même
 * identifiant et le serveur met la ligne à jour. Quitter le contenu clôt la
 * période ; y revenir en ouvre une nouvelle. Le total par contenu est donc la
 * somme des périodes, ce qui répond au cas « 10:00→10:05 puis 10:15→10:20 = 10 min ».
 *
 * Le chrono tourne quand l'onglet est visible et, si `idleDetection`, que
 * l'apprenant a interagi dans les 60 dernières secondes. À la détection
 * d'inactivité, le temps est compté jusqu'à l'instant de détection et non
 * jusqu'à la dernière interaction : lire un texte sans cliquer reste du temps
 * de consultation, et tronquer à la dernière interaction pénaliserait
 * exactement les contenus qui se lisent.
 */
export function useContentTimeTracker({ enrollmentId, courseId, entryId, idleDetection }: Options) {
  // Tout est en refs : ce hook ne doit jamais provoquer de rendu.
  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const accumulatedMsRef = useRef(0);
  /** `performance.now()` du début de la plage active en cours ; null si en pause. */
  const activeSinceRef = useRef<number | null>(null);
  const lastActivityRef = useRef(0);
  /** Instant réel de fin de la dernière plage active — sert de `ended_at`. */
  const lastActiveAtRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enrollmentId || !courseId || !entryId) return;

    const openSession = () => {
      sessionIdRef.current = newSessionId();
      startedAtRef.current = new Date();
      accumulatedMsRef.current = 0;
      lastActiveAtRef.current = null;
    };

    const resume = () => {
      if (activeSinceRef.current !== null) return;
      if (sessionIdRef.current === null) openSession();
      activeSinceRef.current = performance.now();
    };

    const pause = () => {
      if (activeSinceRef.current === null) return;
      accumulatedMsRef.current += performance.now() - activeSinceRef.current;
      activeSinceRef.current = null;
      lastActiveAtRef.current = new Date();
    };

    const send = (close: boolean, keepalive: boolean) => {
      // Replie la plage active en cours sans arrêter le chrono, pour que la
      // sauvegarde périodique reflète le temps jusqu'à maintenant.
      if (activeSinceRef.current !== null) {
        const now = performance.now();
        accumulatedMsRef.current += now - activeSinceRef.current;
        activeSinceRef.current = now;
        lastActiveAtRef.current = new Date();
      }

      const sessionId = sessionIdRef.current;
      const startedAt = startedAtRef.current;
      const endedAt = lastActiveAtRef.current ?? startedAt;
      const accumulatedMs = accumulatedMsRef.current;

      if (close) {
        sessionIdRef.current = null;
        startedAtRef.current = null;
        accumulatedMsRef.current = 0;
        activeSinceRef.current = null;
        lastActiveAtRef.current = null;
      }

      if (!sessionId || !startedAt || !endedAt || accumulatedMs < MIN_REPORTABLE_MS) return;

      void portalContentTimeApi
        .record(
          enrollmentId,
          courseId,
          entryId,
          sessionId,
          {
            started_at: startedAt.toISOString(),
            ended_at: endedAt.toISOString(),
            time_spent: Math.floor(accumulatedMs / 1000),
          },
          { keepalive },
        )
        // Le tracking ne doit jamais dégrader la consultation : un échec réseau
        // est perdu silencieusement, la sauvegarde suivante rattrapera le total
        // puisque le serveur conserve la valeur la plus élevée.
        .catch(() => {});
    };

    const onActivity = () => {
      lastActivityRef.current = performance.now();
      if (document.visibilityState === 'visible') resume();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = performance.now();
        resume();
      } else {
        pause();
        send(false, true);
      }
    };

    const onPageHide = () => {
      pause();
      // Pas de clôture : un `pagehide` peut venir du bfcache et la page revenir.
      // Si elle ne revient pas, cet envoi est le dernier et il a tout persisté.
      send(false, true);
    };

    lastActivityRef.current = performance.now();
    if (document.visibilityState === 'visible') resume();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    if (idleDetection) {
      ACTIVITY_EVENTS.forEach((event) =>
        window.addEventListener(event, onActivity, { passive: true }),
      );
    }

    const flushTimer = window.setInterval(() => send(false, false), FLUSH_INTERVAL_MS);

    const idleTimer = idleDetection
      ? window.setInterval(() => {
          if (performance.now() - lastActivityRef.current > IDLE_MS) pause();
        }, IDLE_CHECK_INTERVAL_MS)
      : undefined;

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      if (idleDetection) {
        ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      }
      window.clearInterval(flushTimer);
      if (idleTimer !== undefined) window.clearInterval(idleTimer);

      // Ce cleanup EST la détection de changement de contenu : FormationPlayer
      // garde le contenu actif en state local, sans changement de route, donc
      // aucun composant ne se démonte quand l'apprenant passe au module suivant.
      pause();
      send(true, true);
    };
  }, [enrollmentId, courseId, entryId, idleDetection]);
}
