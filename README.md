# FootballHub

FootballHub est une application web front-end de consultation des matchs, compétitions, classements et équipes de football.

## Objectif

Le projet permet de :
- consulter les matchs du jour
- afficher les compétitions disponibles
- voir un classement d’une compétition
- rechercher des équipes
- naviguer entre les pages de détail

## Technologies

- HTML5
- CSS3
- JavaScript ES6+
- Tailwind CSS via CDN
- API-Football (en mode mock pendant le développement)

## Structure du projet

- index.html : page d’accueil
- pages/ : pages de matchs, compétitions, équipes et détails
- css/styles.css : styles globaux
- js/api.js : accès aux données et mock API
- js/ui.js : fonctions de rendu DOM
- js/main.js : initialisation des pages

## Lancement du projet

### Option 1 : ouverture directe

Ouvrir le fichier index.html dans le navigateur.

### Option 2 : serveur local simple

Dans le terminal, à la racine du projet :

```bash
python -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000
```

## Clé API

La vraie clé API-Football doit être ajoutée à la fin du projet, une fois la base stable.

Dans le fichier [js/api.js](js/api.js), modifier :

```js
const API_CONFIG = {
  baseUrl: "https://v3.football.api-sports.io",
  apiKey: "", // mettre la clé ici
  timeoutMs: 12000,
  useMock: true
};
```

Puis passer :

```js
useMock: false
```

Il faut éviter de publier la clé dans un dépôt public.

## Remarques

- Le projet fonctionne actuellement en mode mock pour permettre le développement sans dépendre d’une clé API disponible immédiatement.
- La vraie intégration API doit se faire seulement quand le front est stable et validé.
- Les données réelles devront ensuite remplacer progressivement les données mockées.

## État actuel

Le projet est fonctionnel en front-end avec :
- navigation entre les pages
- affichage des matchs
- filtres
- recherche d’équipes
- détail de compétition et de match
- gestion des états de chargement, erreur et absence de données
