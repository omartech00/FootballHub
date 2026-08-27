# FootballHub

FootballHub est une application web front-end de consultation des matchs, compétitions, classements et équipes de football connectée directement à l'API **API-Football** (`api-sports.io`).

## Objectifs du projet

Le projet permet de :
- Consulter en direct les matchs du jour et filtrer par date
- Afficher les compétitions disponibles et leurs informations
- Consulter le classement officiel et les matchs d'une compétition
- Rechercher des équipes et consulter leurs détails (club, stade, effectif)
- Suivre les matchs récents et prochains matchs d'une équipe
- Consulter le détail d'un match (score, événements chronologiques : buts, cartons, remplacements, et statistiques)

## Technologies

- HTML5 (balises sémantiques et structure accessible)
- CSS3 (styles globaux et mise en page responsive)
- Tailwind CSS via CDN
- JavaScript ES6+ (Fetch API, `async` / `await`, manipulation du DOM)
- API-Football (v3.football.api-sports.io)

## Structure du projet

- `index.html` : page d'accueil (matchs du jour, compétitions en vedette, recherche d'équipes)
- `pages/` :
  - `matches.html` : liste des matchs avec sélecteur de date et filtres
  - `match-detail.html` : feuille de match, événements et statistiques détaillées
  - `competitions.html` : liste et recherche de compétitions
  - `competition-detail.html` : classement complet et matchs de la compétition
  - `teams.html` : recherche d'équipes
  - `team-detail.html` : informations du club, stade, matchs récents et à venir
- `css/styles.css` : styles personnalisés et variables de design
- `js/api.js` : couche d'accès direct à API-Football avec normalisation des données JSON
- `js/ui.js` : composants et fonctions de rendu DOM réutilisables
- `js/main.js` : initialisation des pages, routage et gestion des événements

## Lancement du projet

### Option 1 : Serveur local simple (recommandé)

Dans le terminal, à la racine du projet :

```bash
python -m http.server 8000
```

Puis ouvrir dans votre navigateur :

```text
http://localhost:8000
```

### Option 2 : Ouverture directe

Ouvrir directement le fichier `index.html` dans un navigateur moderne.

## Configuration de l'API

L'application consomme directement les endpoints de l'API REST API-Football dans [js/api.js](js/api.js) :

```js
const API_CONFIG = {
  baseUrl: "https://v3.football.api-sports.io",
  apiKey: "6f12433079f755ee03b12efa8b668574",
  timeoutMs: 15000,
  currentSeason: 2024
};
```

