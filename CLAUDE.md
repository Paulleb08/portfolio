# Portfolio de Paul Signe — notes pour Claude

Lues au début de chaque session. Mettre à jour à la fin d'une tâche quand une erreur ou une préférence nouvelle apparaît.

## Le projet
- Site statique servi par GitHub Pages **depuis la racine de `main`** (mode « Deploy from a branch ») : https://paulleb08.github.io/portfolio/
- Pages : `index.html` (portfolio), `cv.html` (CV en annexe, aperçu PDF.js), `vision-board.html` (annexe). Styles communs : `assets/style.css`. Scripts : `assets/translate.js` (Google Traduction + langue auto), `assets/build.js` (animation « le site se construit »).
- Public : **recruteurs** (stage technicien puis alternance) **et** la professeure (consignes ENSAM : page de garde, sommaire automatique, présentation, CV, tableau de valorisation, fiches missions d'une page, annexes).

## Préférences de Paul
- Répondre en français, simplement. Il veut que les changements soient **publiés** : branche → PR → fusion → vérifier en ligne.
- Il veut pouvoir modifier son CV seul : la source est `cv/CV-Paul-Signe.docx`, le PDF publié `assets/CV-Paul-Signe.pdf` (même nom, sinon les liens cassent).
- Les fiches missions forment **une seule catégorie** (pas de « projets » / « expériences »). CV et vision board : seulement dans les annexes, ouverts dans un nouvel onglet.
- Pas de jargon scolaire visible des recruteurs (« fiche 3 », « stage exécutant » → « stage ouvrier », « bonus »…).
- L'audio / la hi-fi est une passion, **pas** le seul secteur visé : rester ouvert à toute la mécanique.

## Faits à ne pas réinventer
- Stage La Poste (PIC Bordeaux-Cestas) : 19/01 → 18/02/2026, 4 semaines temps plein, opérateur (source : rapport de stage).
- Stage technicien recherché : **12/04/2027 → 02/07/2027** (son Canva dit 2026 : faute de frappe confirmée par le portfolio d'un camarade).
- Bac STI2D AC, lycée Livet (Nantes), 2022-2025 ; anglais B2, allemand A1 ; animateur ALSH Les Mille Potes (Arcachon), 2 saisons, groupe de 12.
- Inconnus encore à compléter (laisser surlignés `.todo`, ne pas inventer) : durées en heures des projets et de la garde d'enfant, lettre de recommandation, URL LinkedIn.

## Règles CV (fiche « Le CV » de l'ENSAM + filtres ATS)
- 1 page, une seule colonne, Arial, ni tableau ni zone de texte ; images (photo, QR) en ancrage flottant seulement.
- Titre = « Élève Bachelor de Technologie ENSAM 2e année », objectif daté dessous, nom dans les références (pas en titre).
- Formation d'abord ; dates à gauche « année (durée) », jamais les mois ; heures/semaine pour tout ce qui n'est pas temps plein ; pas de qualités dans Compétences ; pas de phrases rédigées.
- Modifier le .docx **en place** avec python-docx (ne pas le regénérer : Paul peut l'avoir retouché), puis `soffice --headless --convert-to pdf --outdir assets cv/CV-Paul-Signe.docx`. Vérifier : 1 page (`pdfinfo`), texte extrait dans l'ordre (`pdftotext`), QR décodable.

## Lettres de motivation (fiche 2 ENSAM)
- Cibles prioritaires : KEF (Royaume-Uni), Bang & Olufsen (Struer), DALI (Nørager). Lettres **en anglais**, stage sur leurs sites à l'étranger, une phrase sur l'alternance.
- Lien personnel réel : Paul possède une chaîne CD **B&O BeoSound Century**. Aucun lien direct avec KEF ni DALI : ne pas en inventer. Il fait de la MAO.
- Ne jamais committer les lettres dans le dépôt (public, elles contiennent son adresse) : les produire hors dépôt et les lui envoyer. Noms : `LM-Paul-Signe-<Entreprise>`.
- Vérifier chaque fait cité sur une source (site officiel, Wikipédia) avant de l'écrire ; adresse officielle de KEF : GP Acoustics (UK) Ltd, Ipswich (mentions légales).
- Recherche de stage : Paul vise **l'électronique, et si possible le son** (préférence de novembre 2026).
- Apple (stages UK/DK/FR/DE, nov. 2026) : 36 offres, aucune en audio, presque toutes niveau master / 6 mois / génie électrique. La moins éloignée : PMU Silicon Validation Intern, Nabern (200687726-5556, bachelor accepté). Ne pas revendiquer oscilloscope, Python ni « anglais courant » : absents de son CV (anglais B2).
- Avant d'envoyer, se poser ses deux questions : « pourrait-elle partir à n'importe quelle entreprise ? » et « aurait-elle pu être écrite par n'importe qui ? ». Le paragraphe « pourquoi moi » doit relier chaque fait au besoin de l'entreprise.

## Erreurs déjà commises — ne pas recommencer
- **Refonte React + build** : a cassé le site (page blanche) car Pages est en mode branche. Paul a répondu « oui » à « source = GitHub Actions » alors que c'était faux : vérifier par les faits (le run `pages build and deployment` apparaît = mode branche) au lieu de se fier à la réponse. Rester en HTML statique sans étape de build.
- `loading="lazy"` sur les images : vides à l'impression et sur les captures pleine page. Ne pas l'utiliser.
- Composants qui ignorent leurs `props` (classe CSS sans effet). Toujours transmettre `{...props}`.
- Widget Google Traduction : mon CSS rendait le menu invisible (`color: transparent` hérité). Donner une couleur explicite au `select`.
- Bouton « solid » en thème sombre peu lisible : utiliser `--brand`, pas `--accent`.
- Impression : CV sur 2 pages, titres seuls sur une page, marge ajoutée qui crée une page blanche. **Toujours regénérer le PDF d'impression et compter les pages** après un changement de mise en page.
- Animation : un défilement rapide « saute » des blocs (IntersectionObserver ne les voit jamais) → afficher les blocs dépassés ; curseurs restés à l'écran → les masquer quand ils n'ont plus rien à faire.
- `<object>`/`<iframe>` PDF : vide sur Android → afficher le PDF avec PDF.js.
- Lettre Apple : en retirant une formule creuse, j'ai écrit à la place un fait inventé (« les écouteurs que j'utilise pour ma MAO »). En corrigeant une phrase, ne remplacer que par un fait connu ou une formulation neutre.

## Méthode de vérification (Playwright déjà installé)
- Servir le dossier : `python3 -m http.server 8766`, tester `locale: 'fr-FR'` (sinon la traduction auto passe la page en anglais), ordinateur 1440×900 **et** mobile (iPhone 13, Pixel 7), thème clair **et** sombre, aucune `pageerror`, aucune réponse ≥ 400, pas de débordement horizontal.
- Impression : `page.pdf()` ne déclenche pas `beforeprint` → `dispatchEvent(new Event('beforeprint'))` avant. Avec l'animation active, tester avec `reducedMotion: 'reduce'` ou vérifier qu'aucun `.bl-pending` ne reste.
- Après fusion : attendre le déploiement puis vérifier l'URL en ligne avec un paramètre anti-cache (`?v=…`).
- Réseau : Wikimedia et Flickr sont bloqués/limités depuis l'environnement ; pour une image libre de droits, passer par l'API Openverse et son proxy `/v1/images/<id>/thumb/`, et créditer auteur + licence dans la légende.

## Environnement
- Des hooks « Fact-Forcing Gate » exigent, avant la première commande Bash ou la première écriture d'un fichier, d'énoncer la demande et ce que fait l'action (fichiers appelants trouvés par Glob/Grep, données, citation exacte de la demande). Les donner d'emblée pour éviter les refus.
- Branche de travail désignée par la session ; une fois sa PR fusionnée, la recréer depuis `origin/main` avant tout nouveau changement.
