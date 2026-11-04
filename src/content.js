// Tout le texte du site. `fr` et `en` doivent avoir exactement la même forme :
// `npm run check` (lancé avant chaque build) le vérifie.

export const profile = {
  name: 'Paul Signe',
  domain: 'paul-signe.fr',
  email: 'paul.signe@ensam.eu',
  github: 'https://github.com/paulleb08',
  linkedin: '', // à renseigner : URL de ton profil LinkedIn (le bouton s'affiche dès qu'elle est remplie)
  cv: '/CV_Paul_Signe.pdf',
};

export const content = {
  fr: {
    meta: { title: 'Paul Signe — Ingénierie audio & conception Hi-Fi' },
    header: {
      kicker: 'Portfolio · Arts et Métiers (ENSAM)',
      role: 'Étudiant en Bachelor Sciences & Ingénierie — Mécanique & Production',
      pitch:
        "Je conçois des systèmes mécaniques avec une obsession : le son. Je recherche une alternance ou un contrat de professionnalisation en ingénierie audio, acoustique et conception Hi-Fi.",
      status: 'Disponible — alternance / contrat pro',
      cv: 'Télécharger mon CV',
      cvHint: 'PDF compatible ATS',
      langLabel: 'Langue',
    },
    tabs: { projects: 'Projets', experience: 'Expériences', skills: 'Compétences & Formation', vision: 'Vision board' },
    projects: {
      title: 'Projets',
      open: 'Voir le détail',
      close: 'Fermer',
      labels: { context: 'Contexte', solution: 'Solution technique', chain: 'Chaîne fonctionnelle', skills: 'Compétences mobilisées' },
      items: [
        {
          id: 'venturi',
          name: "Tuyère d'aspiration à effet Venturi",
          tagline: 'Aspiration sans pompe, désengorgement mécanique',
          tags: ['Mécanique des fluides', 'CAO', 'Mécanisme'],
          context:
            "Créer une aspiration à partir d'un simple écoulement : l'accélération du fluide dans un col convergent-divergent produit une dépression qui aspire. Deux problèmes à traiter : l'eau entraînée et l'engorgement du conduit.",
          solution: [
            'Tuyère convergente-divergente dimensionnée autour du col (effet Venturi)',
            "Séparateur d'eau intégré au corps de la tuyère",
            'Mécanisme de vibration mécanique pour désengorger le conduit',
          ],
          chain: ['Écoulement moteur', 'Col Venturi', 'Dépression', 'Séparation eau / air', 'Évacuation'],
          skills: ['Principe de Bernoulli', 'Conception de mécanismes', 'Modélisation CAO'],
        },
        {
          id: 'tracker',
          name: "Support d'enceinte motorisé suiveur 2 axes",
          tagline: "Le sweet-spot stéréo suit l'auditeur",
          tags: ['Asservissement', 'Cinématique', 'Acoustique'],
          context:
            "En stéréo, l'image sonore n'est juste qu'au sweet-spot, le point d'écoute idéal. Dès que l'auditeur bouge, l'image se décale. L'idée : que les enceintes le suivent.",
          solution: [
            'Support motorisé à deux axes de rotation (panoramique et inclinaison)',
            "Asservissement dynamique de l'orientation de l'enceinte",
            'Alignement du sweet-spot stéréophonique maintenu en temps réel',
          ],
          chain: ["Position de l'auditeur", 'Calcul de consigne', 'Moteurs 2 axes', 'Orientation enceinte', 'Sweet-spot aligné'],
          skills: ['Cinématique 2 axes', "Boucle d'asservissement", 'Acoustique stéréo'],
        },
        {
          id: 'dynamo',
          name: 'Génératrice dynamo à manivelle',
          tagline: 'De la force du bras à la prise USB',
          tags: ['Transmission', 'Énergie', 'Électronique'],
          context:
            "Recharger un appareil en USB sans réseau électrique, à la seule force du bras. Une manivelle tourne lentement alors qu'une génératrice a besoin de vitesse : il faut multiplier.",
          solution: [
            'Moteur brushless utilisé en génératrice',
            'Multiplicateur à engrenages multi-étages entre manivelle et génératrice',
            'Sortie de recharge USB',
          ],
          chain: ['Manivelle', 'Multiplicateur', 'Génératrice brushless', 'Redressement', 'USB'],
          skills: ["Trains d'engrenages", "Conversion d'énergie", 'Conception mécanique'],
        },
      ],
    },
    experience: {
      title: 'Expériences',
      cols: { period: 'Période', role: 'Poste', org: 'Structure', missions: 'Missions', skills: 'Compétences clés' },
      rows: [
        {
          period: 'Nov. 2026',
          role: 'Stage opérationnel',
          org: 'La Poste — Plateforme Industrielle Courrier, Bordeaux-Cestas',
          missions: 'Gestion et optimisation des flux de courrier sur une chaîne de tri automatisée',
          skills: 'Flux industriels · Rigueur · Travail en équipe',
        },
        {
          period: '2024 – 2026',
          role: 'Animateur / Éducateur',
          org: 'Accueil de loisirs',
          missions: "Encadrement et animation d'enfants de 7 à 11 ans, construction des activités",
          skills: 'Pédagogie · Animation · Leadership',
        },
        {
          period: '2025',
          role: 'Accompagnement spécialisé',
          org: 'Particulier employeur',
          missions: "Accompagnement d'un enfant autiste et non verbal vers plus d'autonomie",
          skills: 'Communication alternative · Patience · Sang-froid',
        },
      ],
    },
    skills: {
      title: 'Compétences & Formation',
      school: {
        label: 'Formation',
        name: 'Bachelor Sciences & Ingénierie — Mécanique & Production',
        org: 'Arts et Métiers (ENSAM) · campus de Bordeaux-Talence',
        period: '2025 – 2028',
        modules: ['Conception mécanique', 'Calcul de structures', 'Méthodes de production'],
      },
      matrixTitle: 'Matrice de compétences',
      levelNames: ['Notions', 'Bases', 'Opérationnel', 'Confirmé', 'Expert'],
      items: [
        { name: 'CAO / CAD', level: 4, tools: 'CATIA V5 · pièces, assemblages, mise en plan' },
        { name: 'Cinématique', level: 3, tools: "Liaisons, mécanismes, trains d'engrenages" },
        { name: 'Acoustique Hi-Fi', level: 2, tools: 'Haut-parleurs, image stéréo, sweet-spot' },
        { name: 'Prototypage rapide', level: 4, tools: 'Impression 3D, Arduino, essais' },
        { name: 'Python', level: 2, tools: 'Scripts de calcul et de traitement de données' },
      ],
    },
    vision: {
      title: 'Vision board',
      intro: "Le son haute fidélité, de la membrane à la pièce d'écoute. Et les maisons où je veux apprendre.",
      quote: '« Turn ideas into reality. »',
      quoteSub: "L'ingénierie mécanique au service du son",
      range: '20 Hz – 20 kHz',
      rangeSub: 'Toute la bande audible à maîtriser',
      targets: 'Entreprises cibles',
      flip: 'Cliquer pour en savoir plus',
      brands: [
        { name: 'Focal', country: 'France', year: '1979', note: 'Saint-Étienne. Célèbre pour ses tweeters à dôme inversé.' },
        { name: 'KEF', country: 'Royaume-Uni', year: '1961', note: 'Maidstone. Inventeur du haut-parleur coaxial Uni-Q.' },
        { name: 'Bang & Olufsen', country: 'Danemark', year: '1925', note: 'Struer. Le design industriel au service du son.' },
        { name: 'Dali', country: 'Danemark', year: '1983', note: 'Nørager. Membranes en fibre de bois, son naturel.' },
        { name: 'Yamaha', country: 'Japon', year: '1887', note: 'Hamamatsu. Des instruments de musique aux enceintes de studio.' },
        { name: 'Hitachi', country: 'Japon', year: '1910', note: 'Ingénierie électrique ; sa marque hi-fi Lo-D a marqué les années 70-80.' },
      ],
    },
    footer: { made: 'Conçu et codé par Paul Signe', school: 'Portfolio de recrutement (ENSAM)' },
  },

  en: {
    meta: { title: 'Paul Signe — Audio engineering & Hi-Fi design' },
    header: {
      kicker: 'Portfolio · Arts et Métiers (ENSAM)',
      role: 'Bachelor of Science & Engineering student — Mechanical Engineering & Production',
      pitch:
        'I design mechanical systems with one obsession: sound. I am looking for a work-study or professional training contract in audio engineering, acoustics and Hi-Fi design.',
      status: 'Available — work-study contract',
      cv: 'Download my resume',
      cvHint: 'ATS-friendly PDF (French)',
      langLabel: 'Language',
    },
    tabs: { projects: 'Projects', experience: 'Experience', skills: 'Skills & Education', vision: 'Vision board' },
    projects: {
      title: 'Projects',
      open: 'See details',
      close: 'Close',
      labels: { context: 'Context', solution: 'Technical solution', chain: 'Functional chain', skills: 'Skills involved' },
      items: [
        {
          id: 'venturi',
          name: 'Venturi suction nozzle',
          tagline: 'Pump-free suction, mechanical unclogging',
          tags: ['Fluid mechanics', 'CAD', 'Mechanism'],
          context:
            'Creating suction from a simple flow: the fluid speeds up through a converging-diverging throat, which creates a low-pressure zone. Two issues to solve: entrained water and clogging of the duct.',
          solution: [
            'Converging-diverging nozzle sized around the throat (Venturi effect)',
            'Water separator built into the nozzle body',
            'Mechanical vibration mechanism to unclog the duct',
          ],
          chain: ['Driving flow', 'Venturi throat', 'Low pressure', 'Water / air separation', 'Discharge'],
          skills: ['Bernoulli principle', 'Mechanism design', 'CAD modelling'],
        },
        {
          id: 'tracker',
          name: 'Motorised 2-axis tracking speaker stand',
          tagline: 'The stereo sweet spot follows the listener',
          tags: ['Control systems', 'Kinematics', 'Acoustics'],
          context:
            'In stereo, the sound image is only right at the sweet spot, the ideal listening position. As soon as the listener moves, the image shifts. The idea: make the speakers follow them.',
          solution: [
            'Motorised stand with two rotation axes (pan and tilt)',
            'Dynamic closed-loop control of the speaker orientation',
            'Stereo sweet-spot alignment kept in real time',
          ],
          chain: ['Listener position', 'Setpoint computation', '2-axis motors', 'Speaker orientation', 'Aligned sweet spot'],
          skills: ['2-axis kinematics', 'Control loop', 'Stereo acoustics'],
        },
        {
          id: 'dynamo',
          name: 'Hand-crank dynamo generator',
          tagline: 'From arm power to a USB port',
          tags: ['Power transmission', 'Energy', 'Electronics'],
          context:
            'Charging a device over USB without mains power, using only arm strength. A crank turns slowly while a generator needs speed: the speed has to be multiplied.',
          solution: [
            'Brushless motor used as a generator',
            'Multi-stage gear train between the crank and the generator',
            'USB charging output',
          ],
          chain: ['Crank', 'Gear train', 'Brushless generator', 'Rectification', 'USB'],
          skills: ['Gear trains', 'Energy conversion', 'Mechanical design'],
        },
      ],
    },
    experience: {
      title: 'Experience',
      cols: { period: 'Period', role: 'Position', org: 'Organisation', missions: 'Missions', skills: 'Key skills' },
      rows: [
        {
          period: 'Nov. 2026',
          role: 'Operations internship',
          org: 'La Poste — Industrial Mail Platform, Bordeaux-Cestas',
          missions: 'Managing and optimising mail flows on an automated sorting line',
          skills: 'Industrial flows · Rigour · Teamwork',
        },
        {
          period: '2024 – 2026',
          role: 'Youth leader / Educator',
          org: 'Holiday centre',
          missions: 'Supervising and running activities for children aged 7 to 11',
          skills: 'Teaching · Facilitation · Leadership',
        },
        {
          period: '2025',
          role: 'Specialised support',
          org: 'Private employer',
          missions: 'Supporting an autistic, non-verbal child towards more autonomy',
          skills: 'Alternative communication · Patience · Composure',
        },
      ],
    },
    skills: {
      title: 'Skills & Education',
      school: {
        label: 'Education',
        name: 'Bachelor of Science & Engineering — Mechanical Engineering & Production',
        org: 'Arts et Métiers (ENSAM) · Bordeaux-Talence campus',
        period: '2025 – 2028',
        modules: ['Mechanical design', 'Structural analysis', 'Production methods'],
      },
      matrixTitle: 'Skills matrix',
      levelNames: ['Awareness', 'Basic', 'Working', 'Proficient', 'Expert'],
      items: [
        { name: 'CAD', level: 4, tools: 'CATIA V5 · parts, assemblies, drawings' },
        { name: 'Kinematics', level: 3, tools: 'Joints, mechanisms, gear trains' },
        { name: 'Hi-Fi acoustics', level: 2, tools: 'Loudspeakers, stereo imaging, sweet spot' },
        { name: 'Rapid prototyping', level: 4, tools: '3D printing, Arduino, testing' },
        { name: 'Python', level: 2, tools: 'Calculation and data-processing scripts' },
      ],
    },
    vision: {
      title: 'Vision board',
      intro: 'High-fidelity sound, from the cone to the listening room. And the companies where I want to learn.',
      quote: '“Turn ideas into reality.”',
      quoteSub: 'Mechanical engineering in the service of sound',
      range: '20 Hz – 20 kHz',
      rangeSub: 'The whole audible band to master',
      targets: 'Target companies',
      flip: 'Click to learn more',
      brands: [
        { name: 'Focal', country: 'France', year: '1979', note: 'Saint-Étienne. Famous for its inverted-dome tweeters.' },
        { name: 'KEF', country: 'United Kingdom', year: '1961', note: 'Maidstone. Inventor of the Uni-Q coaxial driver.' },
        { name: 'Bang & Olufsen', country: 'Denmark', year: '1925', note: 'Struer. Industrial design in the service of sound.' },
        { name: 'Dali', country: 'Denmark', year: '1983', note: 'Nørager. Wood-fibre cones for a natural sound.' },
        { name: 'Yamaha', country: 'Japan', year: '1887', note: 'Hamamatsu. From musical instruments to studio monitors.' },
        { name: 'Hitachi', country: 'Japan', year: '1910', note: 'Electrical engineering; its Lo-D hi-fi brand shaped the 70s and 80s.' },
      ],
    },
    footer: { made: 'Designed and coded by Paul Signe', school: 'Recruitment portfolio (ENSAM)' },
  },
};
