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

	function initHomePage() {}

	function initMatchesPage() {}

	function initMatchDetailPage() {}

	function initCompetitionsPage() {}

	function initCompetitionDetailPage() {}

	function initTeamsPage() {}

	function initTeamDetailPage() {}

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
