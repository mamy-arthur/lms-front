# Simulation de rôles (LMV-307)

## Fonctionnement

- Le bouton **Simuler un rôle** utilise les rôles autorisés retournés par le serveur, jamais une autorisation calculée à partir du rôle affiché.
- L'identité `auth.store.user` et `sessionId` restent réelles. `simulatedRole` et `role` pilotent uniquement la présentation ; `useSimulationUser()` fournit une identité fictive aux écrans.
- L'état serveur est vérifié avant le montage des écrans métier, au retour sur un onglet et lors des notifications entre onglets. Le rechargement reprend le rôle simulé mais réinitialise les modifications locales.
- Les transitions annulent les requêtes en vol, rejettent leurs réponses tardives et vident les caches. Aucun utilisateur fictif n'est persisté dans le stockage d'authentification.
- `apiClient` intercepte les lectures, mutations, multipart et XHR. Les GET explicites de la Boutique et de l’aperçu Formation passent par les routes dédiées `role-simulation/shop/*` et `role-simulation/training/learning-paths`. Les routes inconnues échouent localement, sans repli réseau.
- Les seules écritures réseau liées à cette fonctionnalité sont les commandes de session **POST d'entrée** et **DELETE de sortie**. Elles ne sont pas des actions métier. Aucune commande, aucun paiement, aucun fichier ou mail métier n'est envoyé pendant la simulation.
- Les WebSockets, l'autocomplétion d'adresse externe et l'enregistrement de temps réel sont suspendus. Le SCORM fictif reste inerte ; les packages des formations réelles autorisées s'exécutent en lecture seule, sans suivi Learneo (voir ci-dessous).
- La sortie attend la confirmation serveur avant de réautoriser les données réelles. Une panne réseau maintient le verrouillage, avec possibilité de réessayer, sans déconnexion.

## Boutique et multi-tenancy

Le Super admin peut choisir le catalogue d'une organisation autorisée avant l'entrée. Sans sélection sur le domaine central, la Boutique est vide : aucun tenant n'est choisi arbitrairement. Les autres rôles conservent le catalogue de leur tenant réel. Les écrans hors Boutique et aperçu Formation utilisent des fixtures et un tenant de démonstration.

Les couvertures réelles de la Boutique sont chargées en lecture seule via `GET /api/v1/role-simulation/shop/learning-paths/{id}/image`, y compris dans le panier simulé. Le serveur vérifie à chaque lecture la simulation active, le tenant sélectionné, la visibilité du parcours et son média image. Les routes de médias génériques restent bloquées. Les formations fictives ont une illustration locale visible, sans utiliser les fichiers d'un tenant réel.

Les restrictions d'interface habituelles sont conservées : le rôle Éditeur prévisualise la Boutique, le Client dispose du panier/checkout, et le Stagiaire n'a actuellement pas d'entrée Boutique dans la navigation frontend. La simulation ne lui ajoute pas de privilèges supplémentaires.

## Maintenance et limites explicites

### Aperçu Formation en rôle Stagiaire

- La simulation arrive directement sur `/trainee/formations`.
- **Client → Stagiaire** : formations publiées réellement achetées par le compte Client dans son tenant, y compris quand tous les crédits sont utilisés et quand la formation n’est plus affichée en Boutique. Les paniers et commandes non acquittées n’accordent aucun accès.
- **Éditeur → Stagiaire** : formations de son tenant, y compris les parcours en préparation ; seuls les cours publiés, sections visibles et contenus publiés composent l’aperçu stagiaire.
- **Super admin → Stagiaire** : démonstration fictive inchangée.
- Le catalogue autorisé est chargé en lecture seule puis le contenu à l’ouverture de la formation. Une liste vide reste vide ; une erreur propose de réessayer, sans remplacer les formations par des exemples.
- `training-data.ts` transforme les identifiants réels en identifiants de simulation. Les inscriptions, réponses aux évaluations et progressions sont uniquement locales ; aucun crédit, résultat, inscription réelle ou identité de stagiaire n’est importé ou modifié.
- Les images et médias compatibles passent par un GET dédié limité aux médias référencés par la formation autorisée. Les scripts et liens incorporés au texte riche restent neutralisés. Les contenus de type **URL** conservent leurs liens externes HTTP(S), affichés dans une iframe avec sandbox et sans référent, avec un lien d'ouverture si le site interdit l'intégration. Les schémas exécutables, URL avec identifiants, chemins relatifs et adresses du même hôte restent bloqués en simulation. Aucun droit d'accès aux API métier n'est ajouté ; le site externe peut toutefois effectuer ses propres requêtes ou mesures d'audience. Le SCORM fait l'objet d'un lancement dédié en lecture seule.
- Les données importées ne sont pas persistées et sont supprimées à la sortie. Les GET sont annulés et leurs réponses tardives rejetées lors d’un changement de contexte.

### SCORM réel en lecture seule

- Le lancement utilise exclusivement `GET /api/v1/role-simulation/training/learning-paths/{id}/entries/{entryId}/scorm/launch`. Les identifiants d'inscription, de module et de contenu utilisés par le lecteur restent fictifs.
- Le serveur vérifie l'accès à la formation, le contenu publié et son package prêt. Les fichiers sont servis par une URL signée dédiée, liée à la session d'origine, au tenant, à la formation, au contenu et au package. L'autorisation est revérifiée pour chaque fichier, y compris après sortie de simulation ou révocation d'accès.
- Les API SCORM 1.2 et 2004 sont installées avant le chargement de l'iframe. Elles annoncent le mode `browse`/`no-credit` et une identité fictive. `SetValue` conserve uniquement les valeurs nécessaires au fonctionnement du package en mémoire temporaire ; `Commit` ne produit aucune requête. Ces valeurs sont détruites à la fermeture du lecteur.
- Aucun score, temps ni reprise SCORM n'est enregistré. Les appels de suivi et de temps restent neutralisés. « Terminer et continuer » (ou « Terminer » pour le dernier contenu) valide uniquement l'inscription fictive en mémoire, comme les contenus classiques : la suite reste verrouillée jusque-là, puis le résumé, les coches et la redirection sont actualisés ensemble. Les événements internes du package ne déclenchent pas cette validation. Cette progression locale survit à la fermeture du lecteur pendant la même simulation, mais est supprimée à la sortie/réinitialisation de la simulation ; aucune complétion réelle n'est envoyée au serveur.
- Le sandbox conserve `allow-scripts allow-same-origin`, nécessaires à la découverte synchrone de l'API parent, mais pas les formulaires, popups ni la navigation du parent. La bannière reste visible en mode agrandi. Comme le lecteur SCORM habituel, ce mécanisme suppose des packages d'auteurs de confiance : il n'isole pas un script hostile de la même origine et ne garantit pas l'absence de télémétrie externe propre au package.

`fixtures.ts` contient les jeux de données déconnectés, et `local-api.ts` les contrats locaux avec un registre `SIMULATION_ROUTES`. Tout nouveau parcours API doit ajouter son contrat et ses tests à ce registre. Une route non prise en charge affiche une erreur locale explicite plutôt qu'un faux succès incomplet ou un accès réel.

Les opérations externes sont remplacées par des résultats visuels : uploads avec média de substitution, aperçu de mail sans envoi, import de ZIP SCORM fictif sans extraction, achat sans prestataire de paiement. Seuls les packages déjà extraits et autorisés de l'aperçu Formation sont exécutés. Les rapports et portefeuilles qui utilisent déjà des mocks continuent d'utiliser ces données fictives.

## Déploiement et validation

Déployer le backend et appliquer la migration additive `2026_09_18_000001_add_role_simulation_to_personal_access_tokens` **avant** d'activer ce frontend. Aucune migration n'a été appliquée automatiquement à la base de développement pendant l'implémentation.

Tests ajoutés : matrice des sélecteurs, absence de chaînage, reprise serveur, bannière persistante, conservation de session/identité, échecs réseau, six combinaisons aller-retour, fixtures/CRUD, panier/achat, uploads, allowlist Boutique et annulation des réponses tardives. Les tests SCORM et de suivi du temps vérifient l'absence de rejeu dans un autre contexte.

La validation bout en bout avec les packages de votre tenant reste à effectuer avec une session de test après migration. Les tests composants et les tests réseau utilisent des doubles contrôlés ; ils ne remplacent pas cette recette avec un vrai package auteur.
