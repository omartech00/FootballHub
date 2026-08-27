/*
  App bootstrap & page controllers for FootballHub.
  Handles routing, live API data loading, event listeners, and user interactions.
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
		const filename = path.substring(path.lastIndexOf("/") + 1) || "index.html";
		return filename;
	}

	function highlightNav() {
		const page = getCurrentPage();
		const navLinks = document.querySelectorAll("nav a[href]");
		navLinks.forEach(link => {
			const href = link.getAttribute("href");
			if (
				(page === "index.html" && (href === "index.html" || href === "../index.html")) ||
				(page !== "index.html" && href.includes(page))
			) {
				link.classList.add("text-emerald-400", "font-bold");
			}
		});
	}

	/* ==============================
	   1. Home Page (index.html)
	   ============================== */
	function initHomePage() {
		const mhList = "home-matches-list";
		const mcList = "home-competitions-list";
		const thList = "home-teams-list";

		// Today's matches
		FootballHubUI.setState("home-matches-loading", "Chargement des matchs du jour...", "loading");
		FootballHubAPI.getTodayMatches()
			.then(data => {
				FootballHubUI.clearState("home-matches-loading");
				FootballHubUI.renderMatches(mhList, data);
			})
			.catch(err => {
				FootballHubUI.clearState("home-matches-loading");
				FootballHubUI.setState("home-matches-error", err.message || "Impossible de charger les matchs.", "error");
			});

		// Competitions
		FootballHubUI.setState("home-competitions-loading", "Chargement des compétitions...", "loading");
		FootballHubAPI.getCompetitions()
			.then(data => {
				FootballHubUI.clearState("home-competitions-loading");
				// Display top 12 competitions on home
				FootballHubUI.renderCompetitions(mcList, (data || []).slice(0, 12));
			})
			.catch(err => {
				FootballHubUI.clearState("home-competitions-loading");
				FootballHubUI.setState("home-competitions-error", err.message || "Erreur lors du chargement des compétitions.", "error");
			});

		// Teams interactive search
		const searchContainer = document.getElementById("home-teams-search");
		if (searchContainer) {
			searchContainer.innerHTML = `
				<div class="flex flex-wrap gap-2 items-center mb-4">
					<div class="relative flex-1 min-w-[240px]">
						<input
							id="home-teams-search-input"
							type="text"
							aria-label="Rechercher une équipe"
							placeholder="Rechercher un club (ex: Paris, Real, Manchester, Bayern...)"
							class="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
						/>
					</div>
					<button id="home-teams-search-btn" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-md">
						Rechercher
					</button>
				</div>
			`;

			const input = document.getElementById("home-teams-search-input");
			const btn = document.getElementById("home-teams-search-btn");

			const doSearch = (query) => {
				const q = (query || "").trim();
				if (!q) {
					FootballHubUI.clearState("home-teams-loading");
					FootballHubUI.setState("home-teams-empty", "Entrez le nom d'un club pour lancer la recherche.", "empty");
					const container = document.getElementById(thList);
					if (container) container.innerHTML = "";
					return;
				}
				if (q.length < 3) {
					FootballHubUI.setState("home-teams-error", "Veuillez saisir au moins 3 caractères.", "error");
					return;
				}
				FootballHubUI.clearState("home-teams-empty");
				FootballHubUI.clearState("home-teams-error");
				FootballHubUI.setState("home-teams-loading", "Recherche en direct sur l'API...", "loading");
				FootballHubAPI.searchTeams(q)
					.then(teams => {
						FootballHubUI.clearState("home-teams-loading");
						FootballHubUI.renderTeams(thList, teams);
					})
					.catch(err => {
						FootballHubUI.clearState("home-teams-loading");
						FootballHubUI.setState("home-teams-error", err.message || "Erreur lors de la recherche.", "error");
					});
			};

			const debouncedSearch = debounce((e) => doSearch(e.target.value), 400);
			input?.addEventListener("input", debouncedSearch);
			btn?.addEventListener("click", () => doSearch(input?.value));
		}

		FootballHubUI.setState("home-teams-empty", "Tapez le nom d'un club pour rechercher ses informations en direct.", "empty");
	}

	/* ==============================
	   2. Matches Page (matches.html)
	   ============================== */
	function initMatchesPage() {
		const filtersContainerId = "matches-filters";
		const listId = "matches-list";
		let allMatches = [];
		const todayDateStr = new Date().toISOString().slice(0, 10);

		const applyFilters = () => {
			const competition = document.getElementById("filter-competition")?.value || "all";
			const status = document.getElementById("filter-status")?.value || "all";

			const filtered = allMatches.filter(match => {
				const matchesComp = competition === "all" || (match.competition && String(match.competition.name) === String(competition));
				let matchesStatus = true;
				if (status === "FT") {
					matchesStatus = ["FT", "AET", "PEN"].includes(match.status);
				} else if (status === "LIVE") {
					matchesStatus = ["1H", "2H", "HT", "LIVE", "ET", "P"].includes(match.status);
				} else if (status === "NS") {
					matchesStatus = ["NS", "TBD"].includes(match.status);
				}
				return matchesComp && matchesStatus;
			});

			FootballHubUI.renderMatches(listId, filtered);
		};

		const loadMatchesForDate = (dateVal) => {
			FootballHubUI.setState("matches-loading", `Chargement des matchs pour le ${dateVal}...`, "loading");
			FootballHubAPI.getTodayMatches(dateVal)
				.then(data => {
					allMatches = data || [];
					FootballHubUI.clearState("matches-loading");

					const competitionNames = [...new Set(allMatches
						.filter(m => m.competition && m.competition.name)
						.map(m => m.competition.name))].sort();

					const filters = document.getElementById(filtersContainerId);
					if (filters) {
						filters.innerHTML = `
							<div class="flex flex-wrap gap-3 items-center">
								<div class="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700">
									<label for="filter-date" class="text-xs text-slate-400 font-semibold">Date :</label>
									<input id="filter-date" type="date" value="${dateVal}" class="bg-transparent text-slate-200 text-sm focus:outline-none" />
								</div>
								<select id="filter-competition" class="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500">
									<option value="all">Toutes compétitions (${competitionNames.length})</option>
									${competitionNames.map(name => `<option value="${name}">${name}</option>`).join("")}
								</select>
								<select id="filter-status" class="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500">
									<option value="all">Tous statuts</option>
									<option value="LIVE">🔴 En direct</option>
									<option value="FT">Terminé</option>
									<option value="NS">À venir</option>
								</select>
							</div>
						`;

						document.getElementById("filter-date")?.addEventListener("change", (e) => {
							loadMatchesForDate(e.target.value);
						});
						document.getElementById("filter-competition")?.addEventListener("change", applyFilters);
						document.getElementById("filter-status")?.addEventListener("change", applyFilters);
					}

					applyFilters();
				})
				.catch(err => {
					FootballHubUI.clearState("matches-loading");
					FootballHubUI.setState("matches-error", err.message || "Erreur lors du chargement des matchs.", "error");
				});
		};

		loadMatchesForDate(todayDateStr);
	}

	/* ==============================
	   3. Match Detail Page (match-detail.html)
	   ============================== */
	function initMatchDetailPage() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("id");
		const summaryId = "match-summary";

		if (!id) {
			FootballHubUI.setState("match-events-error", "Identifiant de match manquant dans l'URL.", "error");
			return;
		}

		FootballHubUI.setState("match-events-loading", "Chargement des détails du match...", "loading");
		FootballHubAPI.getMatchById(id)
			.then(match => {
				FootballHubUI.clearState("match-events-loading");
				if (!match) {
					FootballHubUI.setState("match-events-error", "Match non trouvé.", "error");
					return;
				}
				FootballHubUI.renderMatchDetail(summaryId, match);
			})
			.catch(err => {
				FootballHubUI.clearState("match-events-loading");
				FootballHubUI.setState("match-events-error", err.message || "Erreur lors du chargement du match.", "error");
			});
	}

	/* ==============================
	   4. Competitions Page (competitions.html)
	   ============================== */
	function initCompetitionsPage() {
		const listId = "competitions-list";
		let allCompetitions = [];

		FootballHubUI.setState("competitions-loading", "Chargement des compétitions...", "loading");
		FootballHubAPI.getCompetitions()
			.then(data => {
				FootballHubUI.clearState("competitions-loading");
				allCompetitions = data || [];

				const pageHeader = document.querySelector("section[aria-labelledby='competitions-list-title']");
				let searchContainer = document.getElementById("competitions-search-controls");
				if (!searchContainer && pageHeader) {
					searchContainer = document.createElement("div");
					searchContainer.id = "competitions-search-controls";
					searchContainer.className = "mb-4";
					pageHeader.insertBefore(searchContainer, document.getElementById(listId));
				}

				if (searchContainer) {
					searchContainer.innerHTML = `
						<div class="flex flex-wrap gap-2 items-center mb-4">
							<input
								id="competitions-search-input"
								type="text"
								aria-label="Rechercher une compétition"
								placeholder="Filtrer par nom ou pays (ex: Premier League, Ligue 1, France, Espagne...)"
								class="flex-1 min-w-[240px] px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
							/>
						</div>
					`;

					const input = document.getElementById("competitions-search-input");
					const filterComps = (q) => {
						const query = (q || "").toLowerCase().trim();
						if (!query) {
							FootballHubUI.renderCompetitions(listId, allCompetitions);
							return;
						}
						const filtered = allCompetitions.filter(c =>
							(c.name && c.name.toLowerCase().includes(query)) ||
							(c.country && c.country.toLowerCase().includes(query))
						);
						FootballHubUI.renderCompetitions(listId, filtered);
					};

					input?.addEventListener("input", debounce((e) => filterComps(e.target.value), 300));
				}

				FootballHubUI.renderCompetitions(listId, allCompetitions);
			})
			.catch(err => {
				FootballHubUI.clearState("competitions-loading");
				FootballHubUI.setState("competitions-error", err.message || "Erreur lors du chargement des compétitions.", "error");
			});
	}

	/* ==============================
	   5. Competition Detail Page (competition-detail.html)
	   ============================== */
	function initCompetitionDetailPage() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("id");
		if (!id) {
			FootballHubUI.setState("standings-error", "Identifiant de compétition manquant dans l'URL.", "error");
			return;
		}

		const summaryId = "competition-summary";
		FootballHubUI.setState("standings-loading", "Chargement du classement et des informations...", "loading");

		Promise.all([
			FootballHubAPI.getCompetitionById(id),
			FootballHubAPI.getCompetitionStandings(id)
		])
			.then(([comp, rows]) => {
				FootballHubUI.clearState("standings-loading");
				const compInfo = comp || {
					id,
					name: "Compétition",
					country: "International"
				};

				FootballHubUI.renderCompetitionDetail(summaryId, compInfo);
				FootballHubUI.renderStandings("standings-table", rows || []);

				// Load competition matches
				FootballHubUI.setState("competition-matches-loading", "Chargement des matchs de la compétition...", "loading");
				FootballHubAPI.getCompetitionMatches(id)
					.then(matches => {
						FootballHubUI.clearState("competition-matches-loading");
						FootballHubUI.renderMatches("competition-matches-list", matches || []);
					})
					.catch(err => {
						FootballHubUI.clearState("competition-matches-loading");
						FootballHubUI.setState("competition-matches-error", err.message || "Impossible de charger les matchs.", "error");
					});
			})
			.catch(err => {
				FootballHubUI.clearState("standings-loading");
				FootballHubUI.setState("standings-error", err.message || "Erreur lors du chargement des données de la compétition.", "error");
			});
	}

	/* ==============================
	   6. Teams Page (teams.html)
	   ============================== */
	function initTeamsPage() {
		const searchContainerId = "teams-search-controls";
		const listId = "teams-list";

		// Search form
		const container = document.getElementById(searchContainerId);
		if (container) {
			container.innerHTML = `
				<div class="flex flex-wrap gap-2 items-center mb-2">
					<input
						id="teams-search-input"
						type="text"
						aria-label="Rechercher une équipe"
						placeholder="Rechercher un club ou une sélection (ex: Real, Chelsea, Bayern, Sénégal...)"
						class="flex-1 min-w-[240px] px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
					/>
					<button id="teams-search-btn" class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-md text-sm">
						Rechercher
					</button>
				</div>
				<div class="text-xs text-slate-400">Tapez au moins 3 lettres pour lancer la recherche sur l'API.</div>
			`;

			const input = document.getElementById("teams-search-input");
			const btn = document.getElementById("teams-search-btn");

			const doSearch = async (q) => {
				const query = (q || "").trim();
				if (!query) {
					FootballHubUI.clearState("teams-loading");
					FootballHubUI.clearState("teams-error");
					FootballHubUI.setState("teams-loading", "Entrez le nom d'un club pour rechercher.", "empty");
					const listEl = document.getElementById(listId);
					if (listEl) listEl.innerHTML = "";
					return;
				}
				if (query.length < 3) {
					FootballHubUI.setState("teams-error", "Veuillez saisir au moins 3 caractères.", "error");
					return;
				}
				FootballHubUI.clearState("teams-error");
				FootballHubUI.setState("teams-loading", "Recherche en direct sur l'API...", "loading");
				try {
					const results = await FootballHubAPI.searchTeams(query);
					FootballHubUI.clearState("teams-loading");
					FootballHubUI.renderTeams(listId, results);
				} catch (e) {
					FootballHubUI.clearState("teams-loading");
					FootballHubUI.setState("teams-error", e.message || "Erreur lors de la recherche.", "error");
				}
			};

			input?.addEventListener("input", debounce((e) => doSearch(e.target.value), 400));
			btn?.addEventListener("click", () => doSearch(input?.value));
		}

		FootballHubUI.setState("teams-loading", "Entrez le nom d'un club ci-dessus pour lancer la recherche.", "empty");
	}

	/* ==============================
	   7. Team Detail Page (team-detail.html)
	   ============================== */
	function initTeamDetailPage() {
		const params = new URLSearchParams(window.location.search);
		const id = params.get("id");
		if (!id) {
			FootballHubUI.setState("team-recent-error", "Identifiant d'équipe manquant dans l'URL.", "error");
			return;
		}

		// Team summary
		FootballHubUI.setState("team-recent-loading", "Chargement de l'équipe et de ses matchs...", "loading");
		FootballHubAPI.getTeamById(id)
			.then(team => {
				if (!team) {
					FootballHubUI.setState("team-recent-error", "Équipe non trouvée.", "error");
					return;
				}
				FootballHubUI.renderTeamDetail("team-summary", team);

				// Fetch team fixtures from API
				return FootballHubAPI.getTeamMatches(id);
			})
			.then(matchesObj => {
				FootballHubUI.clearState("team-recent-loading");
				if (!matchesObj) return;

				// Recent matches
				if (matchesObj.recent && matchesObj.recent.length) {
					FootballHubUI.renderMatches("team-recent-list", matchesObj.recent);
				} else {
					FootballHubUI.setState("team-recent-list", "Aucun match récent disponible pour cette équipe.", "empty");
				}

				// Upcoming matches
				if (matchesObj.upcoming && matchesObj.upcoming.length) {
					FootballHubUI.renderMatches("team-upcoming-list", matchesObj.upcoming);
				} else {
					FootballHubUI.setState("team-upcoming-list", "Aucun match à venir programmé.", "empty");
				}
			})
			.catch(err => {
				FootballHubUI.clearState("team-recent-loading");
				FootballHubUI.setState("team-recent-error", err.message || "Erreur lors du chargement des données de l'équipe.", "error");
			});
	}

	/* ==============================
	   Router / Bootstrap
	   ============================== */
	function bootstrap() {
		highlightNav();
		const page = getCurrentPage();

		switch (page) {
			case "index.html":
			case "":
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

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", bootstrap);
	} else {
		bootstrap();
	}
})();

