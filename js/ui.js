/*
  UI layer scaffold for FootballHub.
  Day 1 goal: provide reusable rendering helpers.
*/
(function () {
	"use strict";

	function setState(containerId, message, type) {
		const container = document.getElementById(containerId);
		if (!container) {
			return;
		}

		container.className = "state-box";
		if (type === "loading") {
			container.classList.add("state-loading");
		}
		if (type === "error") {
			container.classList.add("state-error");
		}
		if (type === "empty") {
			container.classList.add("state-empty");
		}

		container.textContent = message || "";
	}

	function clearState(containerId) {
		const container = document.getElementById(containerId);
		if (!container) {
			return;
		}

		container.className = "";
		container.textContent = "";
	}

	function renderMatches() {}

	function renderCompetitions() {}

	function renderStandings() {}

	function renderTeams() {}

	window.FootballHubUI = {
		setState,
		clearState,
		renderMatches,
		renderCompetitions,
		renderStandings,
		renderTeams
	};
})();
