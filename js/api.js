/*
  API layer scaffold for FootballHub.
  Day 1 goal: structure only. Real endpoints are implemented later.
*/
(function () {
	"use strict";

	const API_CONFIG = {
		baseUrl: "https://v3.football.api-sports.io",
		apiKey: "6f12433079f755ee03b12efa8b668574",
		timeoutMs: 12000,
		useMock: false
	};

	function setApiKey(key, useLiveApi = true) {
		API_CONFIG.apiKey = key || "";
		API_CONFIG.useMock = !useLiveApi || !API_CONFIG.apiKey;
	}

	function normalizeMatch(item) {
		const fixture = item.fixture || item;
		const teams = item.teams || {};
		const goals = item.goals || {};
		const league = item.league || {};
		return {
			id: fixture.id || item.id,
			date: fixture.date || item.date,
			home: { name: teams.home?.name || item.home?.name || "" },
			away: { name: teams.away?.name || item.away?.name || "" },
			score: {
				home: goals.home ?? item.score?.home ?? null,
				away: goals.away ?? item.score?.away ?? null
			},
			status: fixture.status?.short || item.status || "NS",
			competition: {
				id: league.id || item.competition?.id || null,
				name: league.name || item.competition?.name || ""
			}
		};
	}

	function normalizeCompetition(item) {
		const league = item.league || item;
		return {
			id: league.id || item.id,
			name: league.name || item.name,
			country: league.country?.name || item.country?.name || item.country || ""
		};
	}

	function normalizeStandings(response) {
		const raw = response?.response || response || [];
		const standings = raw[0]?.league?.standings?.[0] || raw[0]?.standings?.[0] || [];
		return standings.map((team, index) => ({
			position: index + 1,
			team: team.team?.name || team.teamName || "",
			played: team.all?.played ?? 0,
			win: team.all?.win ?? 0,
			draw: team.all?.draw ?? 0,
			loss: team.all?.lose ?? team.all?.lost ?? 0,
			points: team.points ?? 0
		}));
	}

	function normalizeTeam(item) {
		const team = item.team || item;
		return {
			id: team.id || item.id,
			name: team.name || item.name,
			country: team.country?.name || item.country?.name || item.country || ""
		};
	}

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function request(url, opts = {}) {
		if (!API_CONFIG.apiKey) {
			return { ok: false, error: new Error('API key missing') };
		}

		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
		try {
			const res = await fetch(url, {
				...opts,
				signal: controller.signal,
				headers: {
					'x-apisports-key': API_CONFIG.apiKey,
					'Accept': 'application/json',
					...(opts.headers || {})
				}
			});
			clearTimeout(id);
			if (!res.ok) throw new Error('Network response was not ok');
			const json = await res.json();
			return { ok: true, data: json };
		} catch (err) {
			clearTimeout(id);
			return { ok: false, error: err };
		}
	}

	async function getTodayMatches() {
		const date = new Date().toISOString().slice(0, 10);
		const url = `${API_CONFIG.baseUrl}/fixtures?date=${date}`;
		const res = await request(url);
		const payload = res.ok ? (res.data?.response || []) : [];
		return payload.map(normalizeMatch);
	}

	async function getCompetitions() {
		const url = `${API_CONFIG.baseUrl}/leagues`;
		const res = await request(url);
		const payload = res.ok ? (res.data?.response || []) : [];
		return payload.map(normalizeCompetition);
	}

	async function getCompetitionStandings(competitionId) {
		const url = `${API_CONFIG.baseUrl}/standings?league=${competitionId}`;
		const res = await request(url);
		const payload = res.ok ? (res.data?.response || []) : [];
		return normalizeStandings(payload);
	}

	async function searchTeams(query) {
		const url = `${API_CONFIG.baseUrl}/teams?search=${encodeURIComponent(query || '')}`;
		const res = await request(url);
		const payload = res.ok ? (res.data?.response || []) : [];
		return payload.map(normalizeTeam);
	}

	async function getCompetitionMatches(competitionId) {
		const url = `${API_CONFIG.baseUrl}/fixtures?league=${competitionId}`;
		const res = await request(url);
		const payload = res.ok ? (res.data?.response || []) : [];
		return payload.map(normalizeMatch);
	}

	window.FootballHubAPI = {
		API_CONFIG,
		request,
		setApiKey,
		getTodayMatches,
		getCompetitions,
		getCompetitionStandings,
		searchTeams,
		getCompetitionMatches
	};
})();
