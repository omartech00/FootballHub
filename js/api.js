/*
  API layer scaffold for FootballHub.
  Day 1 goal: structure only. Real endpoints are implemented later.
*/
(function () {
	"use strict";

	const API_CONFIG = {
		baseUrl: "https://v3.football.api-sports.io",
		apiKey: "",
		timeoutMs: 12000
	};

	async function request() {
		throw new Error("API request not implemented yet.");
	}

	async function getTodayMatches() {
		return request();
	}

	async function getCompetitions() {
		return request();
	}

	async function getCompetitionStandings() {
		return request();
	}

	async function searchTeams() {
		return request();
	}

	window.FootballHubAPI = {
		API_CONFIG,
		request,
		getTodayMatches,
		getCompetitions,
		getCompetitionStandings,
		searchTeams
	};
})();
