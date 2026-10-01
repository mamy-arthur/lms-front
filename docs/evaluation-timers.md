# Évaluations chronométrées : contrat frontend

Implémentation décrite au 1er octobre 2026. Le contrat de référence et les prérequis de déploiement sont dans [../../learneo-be/docs/evaluation-timers.md](../../learneo-be/docs/evaluation-timers.md) ; les routes sont détaillées dans [../../learneo-be/API.md](../../learneo-be/API.md#23-passage-dévaluation-stagiaire).

## Configuration éditeur et affichage apprenant

`time_limit_minutes` accepte `null` (illimité) ou un entier de **1 à 2147483647** inclus. Une création sans champ est illimitée ; en PATCH, omission = inchangé et `null` = suppression de la limite. Le formulaire utilise la conversion/validation de [../src/modules/admin/resources/programs/lib/evaluation-time-limit.ts](../src/modules/admin/resources/programs/lib/evaluation-time-limit.ts).

La durée d'exécution est issue du **nœud gelé de l'inscription**, pas de la configuration catalogue actuelle. Modifier le catalogue ne modifie pas les définitions existantes, même pour leurs tentatives encore à venir. Les anciens snapshots sans ce champ restent illimités. L'écran préalable utilise la configuration projetée ; après démarrage, seuls les champs de la tentative `expires_at` et `server_now` pilotent l'horloge affichée.

## Une identité par document, pas par composant

[../src/modules/portal/resources/formation-learning/lib/evaluation-document-session.ts](../src/modules/portal/resources/formation-learning/lib/evaluation-document-session.ts) conserve `evaluationDocument()` dans la mémoire du document (`window.__learneoEvaluationDocument`). Son `id`, créé par `crypto.randomUUID()`, devient `page_session_id`.

- Création **une seule fois par document et identité de session**, jamais à chaque rendu, tentative ou remontage.
- Aucun stockage persistant : **ni `localStorage`, ni `sessionStorage`, ni cookie** pour cet identifiant ou les brouillons de ce runtime.
- StrictMode, remontage dans le même document et HMR conservent l'identifiant ; un vrai rechargement ou un nouveau document en reçoit un autre. Une restauration conservant le même document n'est pas assimilée automatiquement à un rechargement.
- Les brouillons, révisions, horloges et tentatives verrouillées à échéance sont gardés en mémoire, par tentative. Une nouvelle visite n'hérite pas des sauvegardes de l'ancienne.
- Un changement d'utilisateur, de session authentifiée, de tenant, d'impersonation ou de contexte/epoch de simulation arrête les anciennes files, efface leurs horloges et renouvelle l'UUID. Les résultats asynchrones anciens sont ignorés ; une requête déjà envoyée reste soumise aux contrôles d'accès du backend.
- Cet UUID n'est ni le token d'authentification, ni une preuve de fermeture fournie par le navigateur.

## Résoudre avant de proposer un démarrage

[../src/modules/portal/resources/formation-learning/hooks/useEvaluationLifecycle.ts](../src/modules/portal/resources/formation-learning/hooks/useEvaluationLifecycle.ts) identifie le passage par `(enrollmentId, evaluationId, nodeExecutionId)`. Un changement de `state_revision` seul ne redémarre pas ce cycle.

1. Avant l'écran de départ, appeler **`POST /api/v1/enrollments/{enrollmentId}/evaluations/{evaluationId}/attempts/session`** avec `node_execution_id` et `page_session_id`. Pas de démarrage implicite et pas de `expected_state_revision` sur cette résolution.
2. `data: null` permet l'écran préalable ; le bouton de départ reste soumis aux droits, à la visite actionnable et au budget du round. Une erreur de vérification reste bloquante et propose de réessayer la résolution, pas un démarrage à l'aveugle.
3. Une tentative active du même document restaure les réponses serveur et le temps restant. Un UUID différent fait finaliser une tentative protégée en `page_reload`, ou en `timeout` si déjà échue. Une tentative complétée affiche son résultat sans en créer une autre.
4. Seule l'action explicite de départ appelle `POST /api/v1/enrollments/{enrollmentId}/evaluations/{evaluationId}/attempts` avec la visite, `expected_state_revision` et le même `page_session_id`. `201` signifie création ; `200` peut être un rejeu, y compris un résultat terminé. Un échec réseau ambigu repasse par la vérification de session.
5. Les réponses et soumissions utilisent ensuite l'identifiant de tentative ; ne pas leur substituer une nouvelle visite. Les réponses asynchrones d'une identité ancienne sont ignorées.

Les adaptateurs HTTP sont dans [../src/shared/api/portal.api.ts](../src/shared/api/portal.api.ts). Les réponses contenant une tentative terminée portent `completion_reason` et `execution`. [../src/modules/portal/resources/formation-learning/components/EvaluationRunner.tsx](../src/modules/portal/resources/formation-learning/components/EvaluationRunner.tsx) affiche le résultat et adopte le snapshot d'exécution sans écraser une révision plus récente en cache. Un retry de résultat ne démarre pas immédiatement une autre tentative : il revient à l'action de départ autorisée par la progression.

## Horloge et polling

`expires_at` est une échéance serveur persistée et immuable ; `server_now` date la réponse. L'affichage ancre leur différence sur `performance.now()`, et non sur `Date.now()`. Une réponse ancienne est ignorée ; une réponse plus récente peut raccourcir l'échéance locale, jamais reconstituer le budget. Une tentative chronométrée sans métadonnées d'horloge valides exige une nouvelle vérification, elle n'est pas transformée silencieusement en tentative illimitée.

[../src/modules/portal/resources/formation-learning/hooks/useEvaluationDeadline.ts](../src/modules/portal/resources/formation-learning/hooks/useEvaluationDeadline.ts) rafraîchit l'affichage toutes les 250 ms. Le cycle de vie effectue un **GET `/api/v1/evaluation-attempts/{id}` toutes les 5 secondes** en phase active ou de finalisation, ainsi qu'à l'événement `online`. Ce polling HTTP détecte notamment une complétion depuis un autre onglet ; aucun WebSocket de timer n'est requis.

Le backend peut finaliser à échéance sur ce GET, une réponse, une soumission, une résolution de session ou un rejeu de démarrage. Son scheduler balaie aussi les échéances indépendamment du navigateur. Les timers JavaScript et le réseau peuvent être retardés : ni la cadence de polling ni l'affichage ne promettent une synchronisation instantanée.

À zéro :

- Verrouiller les réponses et arrêter les sauvegardes, y compris hors ligne.
- Appeler `POST /api/v1/evaluation-attempts/{id}/submit` avec `{"reason":"timeout"}` **sans flush tardif des brouillons**. Seules les réponses déjà persistées sont notées.
- En cas de panne réseau, rester verrouillé avec une finalisation en attente, réessayée toutes les 5 secondes, au retour `online` ou explicitement.
- Un refus HTTP ou une réponse incohérente du polling/finalisation interrompt le runtime et exige une résolution de session ; les écritures rejetées/en attente ne sont pas rejouées dans une nouvelle visite.

Le serveur rejette un `timeout` anticipé ou une tentative illimitée en `409`. À la frontière `now >= expires_at`, `timeout` l'emporte sur toute autre raison. Il n'y a **pas de pause**, même si la page est masquée ou suspendue. Modifier `Date` ou l'heure système locale ne modifie pas l'échéance serveur ; cet affichage client n'est pas une protection anti-triche autonome.

## Autosauvegarde, effacement et soumission manuelle

[../src/modules/portal/resources/formation-learning/lib/evaluation-autosave.ts](../src/modules/portal/resources/formation-learning/lib/evaluation-autosave.ts) crée une file série indépendante par question. Les modifications sont envoyées sans attendre la navigation ou la soumission ; une file en cours peut regrouper des modifications intermédiaires vers le dernier brouillon.

- Révision initiale = `quizzes[].answer_revision` reçue du serveur (initialement `0`). Chaque modification incrémente le compteur de **cette question**, y compris l'effacement. Un retry du même brouillon conserve sa révision.
- Envoyer `page_session_id` et `answer_revision` avec `selected_option_ids`, `answer` ou `pairs`. Exemple d'effacement : `{"clear":true,"page_session_id":"00000000-0000-4000-8000-000000000001","answer_revision":2}`. Ne pas convertir une réponse booléenne `false` en effacement.
- Le serveur ignore les révisions inférieures ou égales déjà sauvegardées (`200`) ; un clear avec une révision plus récente persiste `submitted_answer: null` et ne peut pas être annulé par une ancienne sauvegarde.
- Les brouillons d'appariement partiels sont acceptés pour une tentative protégée. La soumission **manuelle** exige néanmoins toutes les paires et toutes les questions complètes, puis attend `flush()` avant `{"reason":"manual"}`. Si le délai expire pendant l'attente, la finalisation timeout ne doit pas attendre cette sauvegarde.
- Le statut UI distingue sauvegarde en cours, sauvegarde confirmée et erreur. Les sauvegardes sont réessayées toutes les 3 secondes pendant la phase active, à `online` et via le bouton de retry ; ce délai est distinct du polling HTTP de 5 secondes.
- Toute réponse API avec `data.status: completed`, même reçue sur `/answer`, est un résultat à adopter. Un **rejeu terminé renvoie `200`, pas un `409` « déjà finalisé »** ; il n'enregistre pas le contenu envoyé et ne consomme pas de nouvelle tentative. Les payloads mal formés et les contrôles d'accès restent susceptibles d'être refusés.

Les métadonnées de transport ne sont pas persistées dans `submitted_answer`. Les raisons `manual`, `timeout`, `page_reload` sont affichées à partir du résultat serveur ; les anciens résultats peuvent n'avoir aucune raison.

## Navigation et limites de détection

[../src/modules/portal/resources/formation-learning/hooks/useEvaluationNavigationGuard.ts](../src/modules/portal/resources/formation-learning/hooks/useEvaluationNavigationGuard.ts) intercepte les liens et le retour arrière, rend les contrôles environnants inertes et enregistre `beforeunload` pendant le verrouillage. Les commandes et dialogues appartenant à l'évaluation doivent rester dans sa racine gardée ; il ne faut pas exempter tous les dialogues externes.

**Ce n'est pas un mode kiosque et cela ne garantit pas d'empêcher de fermer ou recharger le navigateur.** `beforeunload` ne fait que demander l'avertissement natif, soumis aux restrictions du navigateur. Annuler l'avertissement ne finalise pas la tentative.

Il n'y a **aucun submit d'évaluation sur `pagehide`, `visibilitychange`, `beforeunload` ou nettoyage React**, ni dépendance à un beacon de fermeture. Le changement de document est confirmé seulement quand le nouveau document envoie son UUID au **POST de session** et reçoit la décision serveur. Un navigateur fermé brutalement/hors ligne ne garantit donc pas une finalisation immédiate : la réentrée résout la session, ou le scheduler finalise à l'échéance d'une tentative limitée. Une tentative illimitée ne bénéficie pas d'un timeout de secours à la fermeture.

Les fichiers Compose de la racine déclarent le service `scheduler`, à activer après application des migrations ; il n'a pas été démarré pendant cette implémentation. Le polling n'est pas son remplacement : voir les [prérequis backend](../../learneo-be/docs/evaluation-timers.md#déploiement--deux-migrations-et-un-scheduler-actif).

## Compatibilité legacy et simulation

Le frontend courant envoie toujours `page_session_id` au démarrage et à la résolution. L'API backend garde cependant le démarrage sans ce champ/avec `null` pour les anciens clients : pas de détection du nouveau document, pas d'exigence de révision client sur les réponses, et pas de brouillons matching partiels. Sans révision, les retries hors ordre ne sont pas distingués. Une telle tentative n'est pas convertie en tentative protégée par une résolution ultérieure. Une nouvelle tentative legacy limitée par son nœud gelé conserve néanmoins son expiration serveur.

Le mode simulation de [../src/shared/simulation/local-api.ts](../src/shared/simulation/local-api.ts) reproduit les routes de session, délais, révisions, clear et raisons de complétion dans son état en mémoire. Il utilise une horloge locale, des visites synthétiques et sa notation locale existante : **ce n'est ni une échéance serveur durable, ni une preuve de concurrence/notation identique à PostgreSQL**. Ne pas déduire du mode simulation que la fermeture du navigateur a persisté une finalisation backend.

## Tests à lancer séparément

Commandes documentées uniquement, depuis la racine Compose ; **aucun test lancé lors de cette rédaction** :

- Runtime, autosauvegarde et navigation : `docker compose exec -T frontend npm test -- --runInBand --testPathPatterns='EvaluationRunner|useEvaluationLifecycle|useEvaluationDeadline|useEvaluationNavigationGuard|evaluation-autosave'`.
- Configuration et simulation : `docker compose exec -T frontend npm test -- --runInBand --testPathPatterns='evaluation-time-limit|AddEvaluationDialog|evaluation-timer|portal.api|evaluations.api'`.
- Typage : `docker compose exec -T frontend npm run type-check`.

Les suites Jest/jsdom vérifient notamment StrictMode, révisions, effacement, délai monotone, expiration hors ligne, réponses asynchrones obsolètes, navigation et résultats récupérés. Elles ne constituent **pas une validation en navigateur réel** des avertissements natifs, du cache de navigation, de la suspension ou des interactions multi-onglet. Une recette dédiée reste nécessaire. La suite backend standard utilise SQLite ; aucune validation complète de courses PostgreSQL réellement concurrentes n'est attestée ici.
