# Simulation de rôles (LMV-307)

## Fonctionnement

- Le bouton **Simuler un rôle** utilise les rôles autorisés retournés par le serveur, jamais une autorisation calculée à partir du rôle affiché.
- L'identité `auth.store.user` et `sessionId` restent réelles. `simulatedRole` et `role` pilotent uniquement la présentation ; `useSimulationUser()` fournit une identité fictive aux écrans.
- L'état serveur est vérifié avant le montage des écrans métier, au retour sur un onglet et lors des notifications entre onglets. Le rechargement reprend le rôle simulé mais réinitialise les modifications locales.
- Les transitions annulent les requêtes en vol, rejettent leurs réponses tardives et vident les caches. Aucun utilisateur fictif n'est persisté dans le stockage d'authentification.
- `apiClient` intercepte les lectures, mutations, multipart et XHR. Seuls les GET explicites de la Boutique passent par les routes dédiées `role-simulation/shop/*`. Les routes inconnues échouent localement, sans repli réseau.
- Les seules écritures réseau liées à cette fonctionnalité sont les commandes de session **POST d'entrée** et **DELETE de sortie**. Elles ne sont pas des actions métier. Aucune commande, aucun paiement, aucun fichier ou mail métier n'est envoyé pendant la simulation.
- Les WebSockets, l'autocomplétion d'adresse externe et l'enregistrement de temps réel sont suspendus. Le lecteur SCORM affiche une activité locale inerte avec une action de fin simulée ; il n'exécute pas d'archive réelle.
- La sortie attend la confirmation serveur avant de réautoriser les données réelles. Une panne réseau maintient le verrouillage, avec possibilité de réessayer, sans déconnexion.

## Boutique et multi-tenancy

Le Super admin peut choisir le catalogue d'une organisation autorisée avant l'entrée. Sans sélection sur le domaine central, la Boutique est vide : aucun tenant n'est choisi arbitrairement. Les autres rôles conservent le catalogue de leur tenant réel. Les écrans hors Boutique affichent uniquement des fixtures et un tenant de démonstration.

Les couvertures réelles de la Boutique sont chargées en lecture seule via `GET /api/v1/role-simulation/shop/learning-paths/{id}/image`, y compris dans le panier simulé. Le serveur vérifie à chaque lecture la simulation active, le tenant sélectionné, la visibilité du parcours et son média image. Les routes de médias génériques restent bloquées. Les formations fictives ont une illustration locale visible, sans utiliser les fichiers d'un tenant réel.

Les restrictions d'interface habituelles sont conservées : le rôle Éditeur prévisualise la Boutique, le Client dispose du panier/checkout, et le Stagiaire n'a actuellement pas d'entrée Boutique dans la navigation frontend. La simulation ne lui ajoute pas de privilèges supplémentaires.

## Maintenance et limites explicites

`fixtures.ts` contient les jeux de données déconnectés, et `local-api.ts` les contrats locaux avec un registre `SIMULATION_ROUTES`. Tout nouveau parcours API doit ajouter son contrat et ses tests à ce registre. Une route non prise en charge affiche une erreur locale explicite plutôt qu'un faux succès incomplet ou un accès réel.

Les opérations externes sont remplacées par des résultats visuels : uploads avec média de substitution, aperçu de mail sans envoi, SCORM sans extraction/exécution de ZIP, achat sans prestataire de paiement. Les rapports et portefeuilles qui utilisent déjà des mocks continuent d'utiliser ces données fictives.

## Déploiement et validation

Déployer le backend et appliquer la migration additive `2026_09_18_000001_add_role_simulation_to_personal_access_tokens` **avant** d'activer ce frontend. Aucune migration n'a été appliquée automatiquement à la base de développement pendant l'implémentation.

Tests ajoutés : matrice des sélecteurs, absence de chaînage, reprise serveur, bannière persistante, conservation de session/identité, échecs réseau, six combinaisons aller-retour, fixtures/CRUD, panier/achat, uploads, allowlist Boutique et annulation des réponses tardives. Les tests SCORM et de suivi du temps vérifient l'absence de rejeu dans un autre contexte.

La validation visuelle bout en bout reste à effectuer avec une session de test après migration : le navigateur intégré de cet environnement n'a pas conservé les pages ouvertes pour permettre les interactions. Les tests composants et les tests réseau utilisent des doubles contrôlés ; ils ne remplacent pas cette recette navigateur.
