/*
  App bootstrap scaffold for FootballHub.
  Day 1 goal: detect page and wire future handlers.
*/
(function () {
	"use strict";

	function debounce(fn, wait) {
		let t;
		return function (...args) {
			clearTimeout(t);
			t = setTimeout(() => fn.apply(this, args), wait);
		};
	}

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
		const filtersContainerId = 'matches-filters';
		const listId = 'matches-list';
		let allMatches = [];

		const applyFilters = () => {
			const competition = document.getElementById('filter-competition')?.value || 'all';
			const status = document.getElementById('filter-status')?.value || 'all';
			const filtered = allMatches.filter(match => {
				const matchesCompetition = competition === 'all' || (match.competition && String(match.competition.name) === String(competition));
				const matchesStatus = status === 'all' || String(match.status) === String(status);
				return matchesCompetition && matchesStatus;
			});
			FootballHubUI.renderMatches(listId, filtered);
		}

		FootballHubUI.setState('matches-loading','Chargement des matchs...', 'loading');
		FootballHubAPI.getTodayMatches().then(data => {
			allMatches = data || [];
			FootballHubUI.clearState('matches-loading');
			const competitionNames = [...new Set(allMatches
				.filter(m => m.competition && m.competition.name)
				.map(m => m.competition.name))];
			const filters = document.getElementById(filtersContainerId);
			if (filters) {
				filters.innerHTML = `
					<div class="flex flex-wrap gap-3">
						<select id="filter-competition" class="px-3 py-2 rounded bg-gray-800 text-white">
							<option value="all">Toutes compétitions</option>
							${competitionNames.map(name => `<option value="${name}">${name}</option>`).join('')}
						</select>
						<select id="filter-status" class="px-3 py-2 rounded bg-gray-800 text-white">
							<option value="all">Tous statuts</option>
							<option value="FT">Terminé</option>
							<option value="NS">À venir</option>
						</select>
					</div>
				`;
				document.getElementById('filter-competition')?.addEventListener('change', applyFilters);
				document.getElementById('filter-status')?.addEventListener('change', applyFilters);
			}
			applyFilters();
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
		const params = new URLSearchParams(window.location.search);
		const id = params.get('id');
		if (!id) {
			FootballHubUI.setState('standings-error','Identifiant de compétition manquant', 'error');
			return;
		}

		const summaryId = 'competition-summary';
		FootballHubUI.setState('standings-loading','Chargement du classement...', 'loading');
		Promise.all([
			FootballHubAPI.getCompetitions(),
			FootballHubAPI.getCompetitionStandings(id)
		]).then(([comps, rows]) => {
			FootballHubUI.clearState('standings-loading');
			const comp = (comps || []).find(c => String(c.id) === String(id));
			if (!comp) {
				FootballHubUI.setState('standings-error','Compétition non trouvée', 'error');
				return;
			}
			FootballHubUI.renderCompetitionDetail(summaryId, comp);
			FootballHubUI.renderStandings('standings-table', rows || []);
			// load competition matches
			FootballHubUI.setState('competition-matches-loading','Chargement des matchs de la compétition...', 'loading');
			FootballHubAPI.getCompetitionMatches(id).then(matches => {
				FootballHubUI.clearState('competition-matches-loading');
				FootballHubUI.renderMatches('competition-matches-list', matches || []);
			}).catch(() => FootballHubUI.setState('competition-matches-error','Erreur chargement matchs', 'error'));
		}).catch(() => FootballHubUI.setState('standings-error','Erreur classement', 'error'));
	}

	function initTeamsPage() {
		const searchContainerId = 'teams-search-controls';
		const listId = 'teams-list';

		FootballHubUI.setState('teams-loading','Chargement des equipes...', 'loading');
		FootballHubAPI.searchTeams('').then(data => {
			FootballHubUI.clearState('teams-loading');
			FootballHubUI.renderTeams(listId, data);
		}).catch(() => FootballHubUI.setState('teams-error','Erreur equipes', 'error'));

		// render search input
		const container = document.getElementById(searchContainerId);
		if (!container) return;
		container.innerHTML = '';
		const form = document.createElement('div');
		form.className = 'flex gap-2 items-center';
		form.innerHTML = `
			<input id="teams-search-input" aria-label="Rechercher une équipe" placeholder="Rechercher une équipe" class="px-3 py-2 rounded bg-gray-800 text-white flex-1" />
			<button id="teams-search-btn" class="px-3 py-2 bg-green-500 text-black rounded font-semibold">Rechercher</button>
		`;
		container.appendChild(form);

		const input = document.getElementById('teams-search-input');
		const btn = document.getElementById('teams-search-btn');

		const doSearch = async (q) => {
			FootballHubUI.setState('teams-loading','Recherche en cours...', 'loading');
			try {
				const results = await FootballHubAPI.searchTeams(q);
				FootballHubUI.clearState('teams-loading');
				FootballHubUI.renderTeams(listId, results);
			} catch (e) {
				FootballHubUI.setState('teams-error','Erreur recherche', 'error');
			}
		};

		const debounced = debounce((ev) => doSearch(ev.target.value), 300);
		input.addEventListener('input', debounced);
		btn.addEventListener('click', () => doSearch(input.value));
	}

	function initTeamDetailPage() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('id');
		if (!id) {
			FootballHubUI.setState('team-recent-error','Identifiant d\'équipe manquant', 'error');
			return;
		}

		FootballHubUI.setState('team-recent-loading','Chargement de l\'équipe...', 'loading');
		FootballHubAPI.searchTeams('').then(teams => {
			FootballHubUI.clearState('team-recent-loading');
			const team = (teams || []).find(item => String(item.id) === String(id));
			if (!team) {
				FootballHubUI.setState('team-recent-error','Équipe non trouvée', 'error');
				return;
			}
			FootballHubUI.renderTeamDetail('team-summary', team);
			FootballHubUI.renderTeams('team-recent-list', [team]);
			FootballHubUI.renderTeams('team-upcoming-list', [team]);
		}).catch(() => FootballHubUI.setState('team-recent-error','Erreur chargement équipe', 'error'));
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
