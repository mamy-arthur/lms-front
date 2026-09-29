# Progression des vidéos natives

Les médias vidéo résolus par le portail utilisent le lecteur HTML natif et le suivi
`VideoProgressSession`. Chaque vidéo possède son propre signet **par nœud et par
visite du nœud**, même si le cours ou la vidéo sont réutilisés dans le parcours.
Un nouveau passage commence sans reprendre la progression du précédent ; la lecture
historique retrouve uniquement le signet de la visite consultée.
Les liens YouTube/Vimeo, les iframes externes,
le SCORM, l’audio et les PDF ne passent pas par ce suivi.

## Comportement

- Reprise à la dernière position après chargement des métadonnées, sans lecture automatique.
- Ne pas déplacer la lecture si l’apprenant a déjà commencé pendant le chargement.
- « Recommencer » revient à zéro sans effacer les segments déjà visionnés.
- Sauvegarde toutes les dix secondes, à la pause, après déplacement, en fin de vidéo
  et lors de la sortie du contenu. Les envois de sortie utilisent `keepalive`.
- La position et les segments visionnés sont indépendants : avancer jusqu’à la fin
  ne compte pas les passages sautés comme visionnés.
- Les pauses, recherches, attentes de chargement, onglets masqués et interruptions
  longues ne créent pas de segments visionnés artificiels.

## Validation du contenu

La fin de lecture ne valide **jamais automatiquement** le contenu. Le bouton manuel
pause toutes les vidéos et attend leurs sauvegardes avant de sauvegarder le temps
de consultation puis de fermer la visite. Le suivi est figé pendant cette validation
et réactivé si la sauvegarde du temps ou la validation échoue.

Une erreur du signet vidéo ne bloque pas la validation manuelle : elle ne constitue
pas une preuve de complétion. Le temps de consultation conserve ses propres règles.

## API et reprise

`GET/PUT /api/v1/enrollments/{enrollmentId}/courses/{courseId}/entries/{entryId}/videos/{mediaId}/progress`

- GET : `competency_id` (ID du nœud module) et `node_execution_id` en query string.
- PUT : `competency_id`, `node_execution_id`, `expected_state_revision`, `position`,
  `duration`, `watched_ranges`, `version` et `commit_id`.
- GET et PUT renvoient `node_id` et `node_execution_id` avec la progression.
  Le frontend vérifie ces identifiants avant toute reprise ou tout acquittement.
- La base conserve `node_id` et `node_execution_id`. La visite est reliée à son
  inscription et à son tenant par une clé étrangère composée ; l’unicité inclut
  la visite, le cours, le contenu et le média. Les versions et commits sont donc
  indépendants d’un nœud et d’un passage à l’autre.
- Les écritures sont sérialisées. Une nouvelle tentative conserve le même commit
  avant d’envoyer une position plus récente.
- Un brouillon local borné à 20 vidéos et 24 heures permet la reprise après coupure.
  Il est isolé par tenant, apprenant, inscription, nœud, visite, cours, contenu et média.
  Les anciens brouillons sans identité de visite ne sont pas repris.
- Un brouillon périmé côté serveur n’écrase pas le signet d’un autre onglet.
- Les erreurs réseau sont réessayées ; un conflit ou un refus permanent arrête les
  écritures et affiche une invitation à recharger, sans bloquer la lecture.
- La livraison à la fermeture d’un onglet n’est pas garantie par le navigateur ;
  le brouillon est un filet de reprise, pas une garantie de sauvegarde serveur.

La simulation ne lit ni n’écrit de progression vidéo réelle. Les consultations
historiques peuvent reprendre le signet mais restent sans écriture. Tout changement
d’identité, de tenant ou de simulation révoque la session précédente.

## Prérequis backend

Les routes du module `VideoProgress` et sa migration de base de données doivent être
déployées ensemble. Sans elles, la lecture reste disponible, mais la progression
ne peut pas être sauvegardée.
