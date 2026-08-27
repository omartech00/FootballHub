/*
  API layer for FootballHub.
  Direct integration with API-Football (v3.football.api-sports.io).
  No mock data.
*/
(function () {
	"use strict";

	const API_CONFIG = {
		baseUrl: "https://v3.football.api-sports.io",
		apiKey: "6f12433079f755ee03b12efa8b668574",
		timeoutMs: 15000,
		currentSeason: 2024
	};

	function setApiKey(key) {
		API_CONFIG.apiKey = key || "";
	}

	function normalizeMatch(item) {
		if (!item) return null;
		const fixture = item.fixture || item;
		const teams = item.teams || {};
		const goals = item.goals || {};
		const league = item.league || {};
		const score = item.score || {};

		return {
			id: fixture.id || item.id,
			date: fixture.date || item.date,
			status: fixture.status?.short || item.status || "NS",
			statusLong: fixture.status?.long || item.statusLong || "",
			elapsed: fixture.status?.elapsed || item.elapsed || null,
			venue: {
				name: fixture.venue?.name || item.venue?.name || "Stade non spécifié",
				city: fixture.venue?.city || item.venue?.city || ""
			},
			referee: fixture.referee || item.referee || "Non communiqué",
			home: {
				id: teams.home?.id || item.home?.id || null,
				name: teams.home?.name || item.home?.name || "Équipe domicile",
				logo: teams.home?.logo || item.home?.logo || ""
			},
			away: {
				id: teams.away?.id || item.away?.id || null,
				name: teams.away?.name || item.away?.name || "Équipe extérieur",
				logo: teams.away?.logo || item.away?.logo || ""
			},
			score: {
				home: goals.home ?? score.fulltime?.home ?? item.score?.home ?? null,
				away: goals.away ?? score.fulltime?.away ?? item.score?.away ?? null
			},
			competition: {
				id: league.id || item.competition?.id || null,
				name: league.name || item.competition?.name || "Compétition",
				logo: league.logo || item.competition?.logo || "",
				country: league.country || item.competition?.country || ""
			},
			events: (item.events || []).map(e => ({
				time: e.time || {},
				team: e.team || {},
				player: e.player || {},
				assist: e.assist || {},
				type: e.type || "",
				detail: e.detail || ""
			})),
			statistics: item.statistics || [],
			lineups: item.lineups || []
		};
	}

	function normalizeCompetition(item) {
		if (!item) return null;
		const league = item.league || item;
		const country = item.country || {};
		return {
			id: league.id || item.id,
			name: league.name || item.name,
			type: league.type || item.type || "League",
			logo: league.logo || item.logo || "",
			country: country.name || item.country?.name || item.country || "",
			flag: country.flag || item.country?.flag || item.flag || ""
		};
	}

	function normalizeStandings(response) {
		const raw = response?.response || response || [];
		const standingsGroup = raw[0]?.league?.standings?.[0] || raw[0]?.standings?.[0] || raw || [];
		if (!Array.isArray(standingsGroup)) return [];

		return standingsGroup.map((team, index) => ({
			position: team.rank || team.position || index + 1,
			teamId: team.team?.id || team.id || null,
			team: team.team?.name || team.teamName || team.name || "Équipe",
			logo: team.team?.logo || team.logo || "",
			played: team.all?.played ?? team.played ?? 0,
			win: team.all?.win ?? team.win ?? 0,
			draw: team.all?.draw ?? team.draw ?? 0,
			loss: team.all?.lose ?? team.all?.lost ?? team.loss ?? 0,
			goalsFor: team.all?.goals?.for ?? team.goalsFor ?? 0,
			goalsAgainst: team.all?.goals?.against ?? team.goalsAgainst ?? 0,
			goalsDiff: team.goalsDiff ?? (team.all ? ((team.all?.goals?.for ?? 0) - (team.all?.goals?.against ?? 0)) : (team.points || 0)),
			points: team.points ?? 0,
			form: team.form || ""
		}));
	}

	function normalizeTeam(item) {
		if (!item) return null;
		const team = item.team || item;
		const venue = item.venue || {};
		return {
			id: team.id || item.id,
			name: team.name || item.name,
			code: team.code || item.code || "",
			country: team.country?.name || item.country?.name || team.country || "",
			founded: team.founded || item.founded || null,
			national: team.national || false,
			logo: team.logo || item.logo || "",
			venue: {
				id: venue.id || null,
				name: venue.name || "Stade non précisé",
				address: venue.address || "",
				city: venue.city || "",
				capacity: venue.capacity || null,
				surface: venue.surface || "",
				image: venue.image || ""
			}
		};
	}

	async function request(endpoint, opts = {}) {
		if (!API_CONFIG.apiKey) {
			return { ok: false, error: new Error("Clé API manquante") };
		}

		const url = endpoint.startsWith("http")
			? endpoint
			: `${API_CONFIG.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

		try {
			const res = await fetch(url, {
				...opts,
				signal: controller.signal,
				headers: {
					"x-apisports-key": API_CONFIG.apiKey,
					"Accept": "application/json",
					...(opts.headers || {})
				}
			});
			clearTimeout(id);

			if (!res.ok) {
				throw new Error(`Erreur HTTP: ${res.status} ${res.statusText}`);
			}

			const json = await res.json();
			if (json.errors && Object.keys(json.errors).length > 0) {
				const errMsg = Object.values(json.errors).join(", ");
				console.warn("Erreur API-Football:", json.errors);
				return { ok: false, error: new Error(errMsg), data: json };
			}

			return { ok: true, data: json };
		} catch (err) {
			clearTimeout(id);
			console.error("Échec de la requête API:", err);
			return { ok: false, error: err };
		}
	}

	async function getTodayMatches(dateParam) {
		const date = dateParam || new Date().toISOString().slice(0, 10);
		const res = await request(`/fixtures?date=${date}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger les matchs");
		}
		const payload = res.data?.response || [];
		return payload.map(normalizeMatch);
	}

	async function getMatchById(id) {
		if (!id) return null;
		const res = await request(`/fixtures?id=${id}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger le match");
		}
		const payload = res.data?.response || [];
		return payload.length ? normalizeMatch(payload[0]) : null;
	}

	async function getCompetitions() {
		const res = await request(`/leagues?current=true`);
		let payload = [];
		if (res.ok && res.data?.response?.length) {
			payload = res.data.response;
		} else {
			// Fallback to all leagues if current=true returns empty
			const resAll = await request(`/leagues`);
			if (!resAll.ok) {
				throw resAll.error || new Error("Impossible de charger les compétitions");
			}
			payload = resAll.data?.response || [];
		}
		return payload.map(normalizeCompetition);
	}

	async function getCompetitionById(id) {
		if (!id) return null;
		const res = await request(`/leagues?id=${id}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger la compétition");
		}
		const payload = res.data?.response || [];
		return payload.length ? normalizeCompetition(payload[0]) : null;
	}

	async function getCompetitionStandings(competitionId, season = API_CONFIG.currentSeason) {
		const res = await request(`/standings?league=${competitionId}&season=${season}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger le classement");
		}
		return normalizeStandings(res.data);
	}

	async function getCompetitionMatches(competitionId, season = API_CONFIG.currentSeason) {
		const res = await request(`/fixtures?league=${competitionId}&season=${season}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger les matchs de la compétition");
		}
		const payload = res.data?.response || [];
		return payload.map(normalizeMatch);
	}

	async function searchTeams(query) {
		const trimmed = (query || "").trim();
		if (!trimmed) {
			return [];
		}
		if (trimmed.length < 3) {
			throw new Error("Veuillez saisir au moins 3 caractères pour effectuer une recherche.");
		}
		const res = await request(`/teams?search=${encodeURIComponent(trimmed)}`);
		if (!res.ok) {
			throw res.error || new Error("Erreur lors de la recherche des équipes");
		}
		const payload = res.data?.response || [];
		return payload.map(normalizeTeam);
	}

	async function getTeamById(teamId) {
		if (!teamId) return null;
		const res = await request(`/teams?id=${teamId}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger l'équipe");
		}
		const payload = res.data?.response || [];
		return payload.length ? normalizeTeam(payload[0]) : null;
	}

	async function getTeamMatches(teamId, season = API_CONFIG.currentSeason) {
		if (!teamId) return { recent: [], upcoming: [] };
		const res = await request(`/fixtures?team=${teamId}&season=${season}`);
		if (!res.ok) {
			throw res.error || new Error("Impossible de charger les matchs de l'équipe");
		}
		const list = (res.data?.response || []).map(normalizeMatch);
		const recent = list.filter(m => ["FT", "AET", "PEN", "AWD", "WO"].includes(m.status)).slice(-6).reverse();
		const upcoming = list.filter(m => ["NS", "TBD"].includes(m.status)).slice(0, 6);
		return { recent, upcoming };
	}

	window.FootballHubAPI = {
		API_CONFIG,
		request,
		setApiKey,
		getTodayMatches,
		getMatchById,
		getCompetitions,
		getCompetitionById,
		getCompetitionStandings,
		getCompetitionMatches,
		searchTeams,
		getTeamById,
		getTeamMatches
	};
})();

