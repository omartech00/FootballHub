/*
  App bootstrap scaffold for FootballHub.
  Day 1 goal: detect page and wire future handlers.
*/
(function () {
	"use strict";

	function getCurrentPage() {
		const path = window.location.pathname;
		return path.substring(path.lastIndexOf("/") + 1) || "index.html";
	}


	function initHomePage() {
		// Home: load matches, competitions and teams (mock)
		const mhList = 'home-matches-list';
		const mcList = 'home-competitions-list';
		const thList = 'home-teams-list';
		// matches
		FootballHubUI.setState('home-matches-loading','Chargement des matchs...', 'loading');
		FootballHubAPI.getTodayMatches().then(data => {
			FootballHubUI.clearState('home-matches-loading');
			FootballHubUI.renderMatches(mhList, data);
		}).catch(err => {
			FootballHubUI.setState('home-matches-error','Erreur chargement matchs', 'error');
		});

		// competitions
		FootballHubUI.setState('home-competitions-loading','Chargement des compétitions...', 'loading');
		FootballHubAPI.getCompetitions().then(data => {
			FootballHubUI.clearState('home-competitions-loading');
			FootballHubUI.renderCompetitions(mcList, data);
		}).catch(err => {
			FootballHubUI.setState('home-competitions-error','Erreur chargement competitions', 'error');
		});

		// teams (basic list)
		FootballHubUI.setState('home-teams-loading','Chargement des équipes...', 'loading');
		FootballHubAPI.searchTeams('').then(data => {
			FootballHubUI.clearState('home-teams-loading');
			FootballHubUI.renderTeams(thList, data);
		}).catch(err => {
			FootballHubUI.setState('home-teams-error','Erreur chargement equipes', 'error');
		});
	}

	function initMatchesPage() {
		FootballHubUI.setState('matches-loading','Chargement des matchs...', 'loading');
		FootballHubAPI.getTodayMatches().then(data => {
			FootballHubUI.clearState('matches-loading');
			FootballHubUI.renderMatches('matches-list', data);
		}).catch(() => FootballHubUI.setState('matches-error','Erreur chargement matchs', 'error'));
	}

	function initMatchDetailPage() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('id');
		const summaryId = 'match-summary';
		if (!id) {
			FootballHubUI.setState('match-events-error','Identifiant de match manquant', 'error');
			return;
		}

		FootballHubUI.setState('match-events-loading','Chargement du match...', 'loading');
		FootballHubAPI.getTodayMatches().then(list => {
			FootballHubUI.clearState('match-events-loading');
			const match = (list || []).find(m => String(m.id) === String(id));
			if (!match) {
				FootballHubUI.setState('match-events-error','Match non trouvé', 'error');
				return;
			}
			FootballHubUI.renderMatchDetail(summaryId, match);
		}).catch(() => FootballHubUI.setState('match-events-error','Erreur chargement match', 'error'));
	}

	function initCompetitionsPage() {
		FootballHubUI.setState('competitions-loading','Chargement competitions...', 'loading');
		FootballHubAPI.getCompetitions().then(data => {
			FootballHubUI.clearState('competitions-loading');
			FootballHubUI.renderCompetitions('competitions-list', data);
		}).catch(() => FootballHubUI.setState('competitions-error','Erreur', 'error'));
	}

	function initCompetitionDetailPage() {
		// placeholder: load standings for a competition id
		const compId = 101; // example
		FootballHubUI.setState('standings-loading','Chargement du classement...', 'loading');
		FootballHubAPI.getCompetitionStandings(compId).then(rows => {
			FootballHubUI.clearState('standings-loading');
			FootballHubUI.renderStandings('standings-table', rows);
		}).catch(() => FootballHubUI.setState('standings-error','Erreur classement', 'error'));
	}

	function initTeamsPage() {
		FootballHubUI.setState('teams-loading','Chargement des equipes...', 'loading');
		FootballHubAPI.searchTeams('').then(data => {
			FootballHubUI.clearState('teams-loading');
			FootballHubUI.renderTeams('teams-list', data);
		}).catch(() => FootballHubUI.setState('teams-error','Erreur equipes', 'error'));
	}

	function initTeamDetailPage() {
		// placeholder
	}

	function bootstrap() {
		const page = getCurrentPage();

		switch (page) {
			case "index.html":
				initHomePage();
				break;
			case "matches.html":
				initMatchesPage();
				break;
			case "match-detail.html":
				initMatchDetailPage();
				break;
			case "competitions.html":
				initCompetitionsPage();
				break;
			case "competition-detail.html":
				initCompetitionDetailPage();
				break;
			case "teams.html":
				initTeamsPage();
				break;
			case "team-detail.html":
				initTeamDetailPage();
				break;
			default:
				break;
		}
	}

	document.addEventListener("DOMContentLoaded", bootstrap);
})();
