import { useEffect, useRef } from 'react';
import { type ContentTimeSessionPayload, portalContentTimeApi } from '@/shared/api/portal.api';

/** Au-delà, on considère l'apprenant parti et le chrono se met en pause. */
const IDLE_MS = 60_000;
/** Sauvegarde périodique : c'est le filet contre les fermetures brutales d'onglet. */
const FLUSH_INTERVAL_MS = 30_000;
/** Fréquence de contrôle de l'inactivité. Pas besoin de plus fin : le seuil est à 60 s. */
const IDLE_CHECK_INTERVAL_MS = 5_000;
/** En deçà, la période n'est pas envoyée : elle n'apprend rien et pollue les analyses. */
const MIN_REPORTABLE_MS = 1_000;

/** File des envois non acquittés, relue au montage suivant — y compris après un rechargement. */
const PENDING_STORAGE_KEY = 'learneo:content-time:pending';
/** Au-delà, une période non acquittée est abandonnée : elle n'a plus de valeur analytique. */
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
/** Garde-fou : une file qui déborde signale un backend durablement indisponible. */
const PENDING_MAX_ENTRIES = 20;
/**
 * En deçà, l'envoi est probablement encore en vol. Le rejouer immédiatement
 * doublerait chaque changement de contenu, dont la clôture précède de quelques
 * millisecondes le montage suivant.
 */
const PENDING_GRACE_MS = 5_000;

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

/** Une période prête à partir, conservée jusqu'à son acquittement par le serveur. */
interface PendingRecord {
  enrollmentId: string;
  courseId: string;
  entryId: string;
  sessionId: string;
  payload: ContentTimeSessionPayload;
  /** `Date.now()` de la mise en file, pour l'âge et le délai de grâce. */
  queuedAt: number;
}

function isPendingRecord(value: unknown): value is PendingRecord {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.enrollmentId === 'string' &&
    typeof record.courseId === 'string' &&
    typeof record.entryId === 'string' &&
    typeof record.sessionId === 'string' &&
    typeof record.queuedAt === 'number' &&
    typeof record.payload === 'object' &&
    record.payload !== null
  );
}

/**
 * Le stockage peut être indisponible (navigation privée, quota, cookies tiers
 * bloqués). Le suivi du temps ne doit jamais faire échouer la consultation :
 * toutes les lectures et écritures dégradent silencieusement vers « pas de file ».
 */
function readPending(): PendingRecord[] {
  try {
    const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter(isPendingRecord) : [];
  } catch {
    return [];
  }
}

function writePending(records: PendingRecord[]): void {
  try {
    if (records.length === 0) {
      window.localStorage.removeItem(PENDING_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      PENDING_STORAGE_KEY,
      JSON.stringify(records.slice(-PENDING_MAX_ENTRIES)),
    );
  } catch {
    /* Stockage indisponible : la période ne survivra pas à la page, tant pis. */
  }
}

/** Une même période n'a qu'une entrée : la dernière mesure remplace la précédente. */
function rememberPending(record: Omit<PendingRecord, 'queuedAt'>): void {
  const others = readPending().filter((pending) => pending.sessionId !== record.sessionId);

  writePending([...others, { ...record, queuedAt: Date.now() }]);
}

function forgetPending(sessionId: string): void {
  writePending(readPending().filter((pending) => pending.sessionId !== sessionId));
}

/**
 * Une erreur 4xx ne deviendra jamais un succès : inscription supprimée, contenu
 * sorti du parcours, période appartenant à un autre compte. La rejouer à chaque
 * montage ferait grossir la file sans fin. 408 et 429 sont au contraire
 * transitoires et méritent une nouvelle tentative.
 */
function isPermanentFailure(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;

  return (
    typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429
  );
}

/**
 * L'envoi n'est retiré de la file qu'une fois acquitté. C'est ce qui rend la
 * clôture finale sûre : elle n'a par définition pas de sauvegarde suivante pour
 * rattraper un échec réseau, et le hook a déjà remis ses compteurs à zéro quand
 * la réponse arrive. Le rejeu est sans risque, la route est idempotente sur
 * l'identifiant de période et le serveur ne retient que la valeur la plus haute.
 */
async function postRecord(record: PendingRecord, keepalive: boolean): Promise<void> {
  try {
    await portalContentTimeApi.record(
      record.enrollmentId,
      record.courseId,
      record.entryId,
      record.sessionId,
      record.payload,
      { keepalive },
    );

    forgetPending(record.sessionId);
  } catch (error) {
    if (isPermanentFailure(error)) forgetPending(record.sessionId);
  }
}

/**
 * Rejoue les périodes des contenus précédents restées sur le carreau. Appelée au
 * montage et à chaque sauvegarde périodique, elle est le seul chemin de reprise
 * après un échec réseau ou une page fermée avant l'acquittement.
 */
function retryPending(excludedSessionId: string | null): void {
  const now = Date.now();
  const pending = readPending();
  const fresh = pending.filter((record) => now - record.queuedAt < PENDING_MAX_AGE_MS);

  if (fresh.length !== pending.length) writePending(fresh);

  fresh
    .filter(
      (record) =>
        record.sessionId !== excludedSessionId && now - record.queuedAt > PENDING_GRACE_MS,
    )
    .forEach((record) => void postRecord(record, false));
}

interface Options {
  enrollmentId: string | null;
  courseId: string | null;
  entryId: string | null;
  /** Module depuis lequel le contenu est consulté. */
  competencyId: string | null;
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
export function useContentTimeTracker({
  enrollmentId,
  courseId,
  entryId,
  competencyId,
  idleDetection,
}: Options) {
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
    if (!enrollmentId || !courseId || !entryId || !competencyId) return;

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

      const record: PendingRecord = {
        enrollmentId,
        courseId,
        entryId,
        sessionId,
        payload: {
          competency_id: competencyId,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          time_spent: Math.floor(accumulatedMs / 1000),
        },
        queuedAt: Date.now(),
      };

      // Mise en file AVANT l'envoi : si celui-ci échoue, ou si la page disparaît
      // avant l'acquittement, la période est rejouée au montage suivant. Le
      // tracking ne doit jamais dégrader la consultation, donc rien n'est
      // remonté à l'appelant ici.
      rememberPending(record);

      void postRecord(record, keepalive);
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

    const onPageShow = () => {
      // Retour depuis le bfcache : `pagehide` a mis le chrono en pause et rien
      // ne le relancerait. Ni `visibilitychange` ni les écouteurs d'activité ne
      // se déclenchent à la restauration, et pour un contenu SCORM ces derniers
      // ne sont même pas posés : tout le temps qui suit serait perdu.
      lastActivityRef.current = performance.now();
      if (document.visibilityState === 'visible') resume();
    };

    lastActivityRef.current = performance.now();
    if (document.visibilityState === 'visible') resume();

    // Les périodes des contenus précédents qui n'ont jamais été acquittées.
    retryPending(sessionIdRef.current);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    if (idleDetection) {
      ACTIVITY_EVENTS.forEach((event) =>
        window.addEventListener(event, onActivity, { passive: true }),
      );
    }

    const flushTimer = window.setInterval(() => {
      retryPending(sessionIdRef.current);
      send(false, false);
    }, FLUSH_INTERVAL_MS);

    const idleTimer = idleDetection
      ? window.setInterval(() => {
          if (performance.now() - lastActivityRef.current > IDLE_MS) pause();
        }, IDLE_CHECK_INTERVAL_MS)
      : undefined;

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
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
    // `competencyId` fait partie des dépendances : changer de module change le
    // contexte de la période, donc la période en cours doit être close.
  }, [enrollmentId, courseId, entryId, competencyId, idleDetection]);
}
