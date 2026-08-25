/*
  API layer scaffold for FootballHub.
  Day 1 goal: structure only. Real endpoints are implemented later.
*/
(function () {
	"use strict";

	const API_CONFIG = {
		baseUrl: "https://v3.football.api-sports.io",
		apiKey: "", // add your key here for real requests
		timeoutMs: 12000,
		useMock: true
	};

	// Mock data to work offline / without API key
	const MOCK = {
		matches: [
			{ id: 1, date: '2026-08-25T20:00:00Z', home: { name: 'Olympic City' }, away: { name: 'Rivers United' }, score: { home: 2, away: 1 }, status: 'FT', competition: { id: 101, name: 'Premier Division' } },
			{ id: 2, date: '2026-08-25T22:00:00Z', home: { name: 'North Stars' }, away: { name: 'South Rovers' }, score: { home: null, away: null }, status: 'NS', competition: { id: 102, name: 'National Cup' } }
		],
		competitions: [
			{ id: 101, name: 'Premier Division', country: 'Country A' },
			{ id: 102, name: 'National Cup', country: 'Country B' }
		],
		teams: [
			{ id: 201, name: 'Olympic City', country: 'Country A' },
			{ id: 202, name: 'Rivers United', country: 'Country A' },
			{ id: 203, name: 'North Stars', country: 'Country B' },
			{ id: 204, name: 'South Rovers', country: 'Country B' }
		],
		standings: {
			101: [
				{ position: 1, team: 'Olympic City', played: 10, win: 7, draw: 2, loss: 1, points: 23 },
				{ position: 2, team: 'Rivers United', played: 10, win: 6, draw: 3, loss: 1, points: 21 }
			]
		}
	};

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function request(url, opts = {}) {
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			// development mode: use mock
			await delay(300);
			return { ok: true, data: null };
		}

		// Placeholder for real fetch implementation when API key is available
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
		try {
			const res = await fetch(url, { ...opts, signal: controller.signal, headers: { 'x-apisports-key': API_CONFIG.apiKey } });
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
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			await delay(200);
			return MOCK.matches;
		}
		const url = `${API_CONFIG.baseUrl}/fixtures?date=${new Date().toISOString().slice(0,10)}`;
		const res = await request(url);
		return res.ok ? res.data : [];
	}

	async function getCompetitions() {
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			await delay(200);
			return MOCK.competitions;
		}
		const url = `${API_CONFIG.baseUrl}/leagues`;
		const res = await request(url);
		return res.ok ? res.data : [];
	}

	async function getCompetitionStandings(competitionId) {
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			await delay(200);
			return MOCK.standings[competitionId] || [];
		}
		const url = `${API_CONFIG.baseUrl}/standings?league=${competitionId}`;
		const res = await request(url);
		return res.ok ? res.data : [];
	}

	async function searchTeams(query) {
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			await delay(150);
			if (!query) return MOCK.teams;
			const q = query.toLowerCase();
			return MOCK.teams.filter(t => t.name.toLowerCase().includes(q));
		}
		const url = `${API_CONFIG.baseUrl}/teams?search=${encodeURIComponent(query)}`;
		const res = await request(url);
		return res.ok ? res.data : [];
	}

	async function getCompetitionMatches(competitionId) {
		if (API_CONFIG.useMock || !API_CONFIG.apiKey) {
			await delay(200);
			// return matches that belong to this competition id
			return MOCK.matches.filter(m => m.competition && String(m.competition.id) === String(competitionId));
		}
		const url = `${API_CONFIG.baseUrl}/fixtures?league=${competitionId}`;
		const res = await request(url);
		return res.ok ? res.data : [];
	}

	window.FootballHubAPI = {
		API_CONFIG,
		request,
		getTodayMatches,
		getCompetitions,
		getCompetitionStandings,
		searchTeams
		,getCompetitionMatches
	};
})();
