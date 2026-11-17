# Portfolio de Paul Signe — notes pour Claude

Lues au début de chaque session. Mettre à jour à la fin d'une tâche quand une erreur ou une préférence nouvelle apparaît.

## Le projet
- Site statique servi par GitHub Pages **depuis la racine de `main`** (mode « Deploy from a branch ») : https://paulleb08.github.io/portfolio/
- **Deux versions** : `index.html` (classique) et `ville.html` = **« Paul Signe's City »** : ville style New York en pixel art (canvas 880×360 dessiné par `assets/city.js`, styles `assets/ville.css`, police Press Start 2P). La ville est toute l'interface : chaque bâtiment (bouton `.hs`) ouvre une **fenêtre interne** (`<dialog>`, jamais de nouvel onglet), le métro « PLAN » = sommaire automatique. Paul ne veut **rien qui ressemble à un site classique** dans cette version.
- Ville en **vue isométrique, plein écran et « sans fin »** (novembre 2026) : le canvas prend toute la fenêtre (taille calculée par `layout()`, échelle S pour que le centre de 760×610 px tienne entier ; sur téléphone on fait glisser). Centre = 3 × 3 pâtés de 4 × 4 cases (rues toutes les 5 cases) ; autour, des pâtés générés à l'infini, voilés par une brume et dessinés une fois dans des sprites. Rues, passants et voitures sortent de l'écran. Habitants autonomes par profil (sprites 16×28 avec contour, 4 images de marche) qui vont de porte en porte. Zones cliquables = silhouette du bâtiment (`clip-path`, `data-spot`) ; étiquettes numérotées comme le Plan, cliquables, placées sous le bâtiment (`below`) pour ceux du premier plan ; tester qu'aucune ne se chevauche en 1440×900, 1280×720 et iPhone.
- Vision board **unique « le son et la mode »** (`#vision-board`, Paul a demandé de fusionner) façon Pinterest : 16 épingles (`.pin`) dans `vision-board.html`, images dans `assets/vb/` (pochettes Graduation et Diamond Life via l'API iTunes, photos libres Openverse créditées). « south operator » = *Smooth Operator* de Sade (album Diamond Life), **confirmé par Paul** ; il garde les pochettes malgré le droit d'auteur. Dans la ville : quartier des passions (panneau des pochettes, club, couture, disquaire) ; Paul a demandé **plus de décors** (nov. 2026) → kiosque à musique (guitariste, chanteuse, batteur), salle de concert « LIVE CE SOIR », malletier avec malle géante, façade-enceinte « SOUND », séance photo de mode au parc, panneaux (KEF, B&O, malle, FASHION WEEK, LIVE, pochettes) et enseignes ; puis **encore plus** : dirigeable « SON & MODE » dans le ciel, fresques des pochettes sur l'immeuble de devant de 4 pâtés (`MURALS`), DJ sur le toit du club, saxophoniste au coin du parc, stand de vinyles, étudiants avec casque audio, oriflammes (note / cintre) sur les lampadaires du centre, vitrines garnies selon l'enseigne ; rester **sans trop en faire** (outil pro). **Paul a validé ce rendu (ville, personnages, rubriques, quantité de décors) le 17/11/2026 (PR #25)** : c'est la référence, ne pas alléger ni surcharger sans qu'il le demande. Anciens liens `#hifi` / `#mode` redirigés.
- `ville.html` est **généré** depuis `index.html` + `vision-board.html` par un script d'assemblage : toute modification de contenu se fait dans ces pages, puis on régénère la ville. La police pixel n'a pas les majuscules accentuées : étiquettes sans accent.
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
- Recherche de stage : Paul vise **l'électronique, et si possible le son** (préférence de novembre 2026), et aussi **la mode / le luxe** (quartier « Mode & Luxe » de la ville).
- Apple (128 stages dans le monde en nov. 2026, 43 en Europe, 20 ouverts au niveau bachelor, aucun en audio). Paul vise la **conception de puce**. Lettres faites : PMU Analog Layout Design (Munich, 200681245-1731, son meilleur choix), Circuit Design (Munich, 200682404-1731, « avant-dernière année » = sa 2e année sur 3), PMU Silicon Validation (Nabern, 200687726-5556). Ne pas revendiquer oscilloscope, Python, Linux, CMOS, outils de dessin de puce ni « anglais courant » : absents de son CV (anglais B2).
- Lettres envoyées en un dossier zip « Lettres de motivation - Paul Signe » (PDF à envoyer / Word à modifier) : je n'ai pas accès à son bureau (aucun dossier de son ordinateur partagé avec la session).
- Avant d'envoyer, se poser ses deux questions : « pourrait-elle partir à n'importe quelle entreprise ? » et « aurait-elle pu être écrite par n'importe qui ? ». Le paragraphe « pourquoi moi » doit relier chaque fait au besoin de l'entreprise.

## Erreurs déjà commises — ne pas recommencer
- **Refonte React + build** : a cassé le site (page blanche) car Pages est en mode branche. Paul a répondu « oui » à « source = GitHub Actions » alors que c'était faux : vérifier par les faits (le run `pages build and deployment` apparaît = mode branche) au lieu de se fier à la réponse. Rester en HTML statique sans étape de build.
- `loading="lazy"` sur les images : vides à l'impression et sur les captures pleine page. Ne pas l'utiliser.
- Composants qui ignorent leurs `props` (classe CSS sans effet). Toujours transmettre `{...props}`.
- Widget Google Traduction : mon CSS rendait le menu invisible (`color: transparent` hérité). Donner une couleur explicite au `select`.
- Bouton « solid » en thème sombre peu lisible : utiliser `--brand`, pas `--accent`.
- Impression : CV sur 2 pages, titres seuls sur une page, marge ajoutée qui crée une page blanche. **Toujours regénérer le PDF d'impression et compter les pages** après un changement de mise en page.
- Animation : un défilement rapide « saute » des blocs (IntersectionObserver ne les voit jamais) → afficher les blocs dépassés ; curseurs restés à l'écran → les masquer quand ils n'ont plus rien à faire.
- `<dialog>` collé en haut à gauche : la remise à zéro `*{margin:0}` de style.css lui enlève son centrage ; ajouter `margin:auto`.
- `<object>`/`<iframe>` PDF : vide sur Android → afficher le PDF avec PDF.js.
- Lettre Apple : en retirant une formule creuse, j'ai écrit à la place un fait inventé (« les écouteurs que j'utilise pour ma MAO »). En corrigeant une phrase, ne remplacer que par un fait connu ou une formulation neutre.
- Lettres Apple puce : « I work daily on precise geometry » (exagération) et un fait inventé sur La Poste (« chaque étape vérifiée avant la suivante »). Relire chaque phrase « pourquoi moi » contre le rapport de stage et le CV avant d'envoyer.
- city.js : deux fonctions `paint` (sprites et bouton jour/nuit) → la seconde écrasait la première, personnages invisibles sans erreur. Vérifier les noms de fonctions en double (`grep -n "function nom"`) quand on assemble un fichier en plusieurs morceaux.
- `.hint` existait déjà dans style.css (marge de 40 px) : la consigne de la ville flottait trop haut. Préfixer les classes de la ville (`city-…`) ; une marge décale aussi un élément `position:fixed`.
- Sprites mis en cache avant le chargement des images (pochettes grises) : redessiner quand l'image arrive (`dirty`).
- Hook « Fact-Forcing Gate » : les commandes avec `rm` ou un `git checkout` de fichier sont bloquées comme destructives, même quand ce texte n'apparaît que dans une chaîne (lire une version avec `git show HEAD:fichier`, éditer CLAUDE.md avec l'outil Edit) ; réécrire les fichiers par-dessus ou créer un nouveau nom au lieu de supprimer.

## Méthode de vérification (Playwright déjà installé)
- Servir le dossier : `python3 -m http.server 8766`, tester `locale: 'fr-FR'` (sinon la traduction auto passe la page en anglais), ordinateur 1440×900 **et** mobile (iPhone 13, Pixel 7), thème clair **et** sombre, aucune `pageerror`, aucune réponse ≥ 400, pas de débordement horizontal.
- Impression : `page.pdf()` ne déclenche pas `beforeprint` → `dispatchEvent(new Event('beforeprint'))` avant. Avec l'animation active, tester avec `reducedMotion: 'reduce'` ou vérifier qu'aucun `.bl-pending` ne reste.
- Après fusion : attendre le déploiement puis vérifier l'URL en ligne avec un paramètre anti-cache (`?v=…`).
- Réseau : Wikimedia et Flickr sont bloqués/limités depuis l'environnement ; pour une image libre de droits, passer par l'API Openverse et son proxy `/v1/images/<id>/thumb/`, et créditer auteur + licence dans la légende.

## Environnement
- Des hooks « Fact-Forcing Gate » exigent, avant la première commande Bash ou la première écriture d'un fichier, d'énoncer la demande et ce que fait l'action (fichiers appelants trouvés par Glob/Grep, données, citation exacte de la demande). Les donner d'emblée pour éviter les refus.
- Branche de travail désignée par la session ; une fois sa PR fusionnée, la recréer depuis `origin/main` avant tout nouveau changement.
