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

	function formatDate(iso) {
		try {
			const d = new Date(iso);
			return d.toLocaleString();
		} catch (e) { return iso; }
	}

	function renderMatches(containerId, matches = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		if (!matches.length) {
			setState(containerId.replace('-list','-empty') || '', 'Aucun match', 'empty');
			return;
		}

		// decide detail base path depending on current location
		const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
		matches.forEach(m => {
			const wrapper = document.createElement('div');
			wrapper.className = 'mb-3';
			const a = document.createElement('a');
			a.href = `${base}match-detail.html?id=${encodeURIComponent(m.id)}`;
			a.className = 'block';

			const el = document.createElement('article');
			el.className = 'p-3 bg-gray-900/40 rounded-lg border hover:bg-gray-900/60';
			el.innerHTML = `
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<strong class="text-lg">${m.home.name}</strong>
						<span class="text-sm text-gray-400">vs</span>
						<strong class="text-lg">${m.away.name}</strong>
					</div>
					<div class="text-right text-sm text-gray-300">
						<div>${formatDate(m.date)}</div>
						<div>${m.status}${m.score && m.score.home != null ? ' • ' + m.score.home + ' - ' + m.score.away : ''}</div>
					</div>
				</div>
			`;

			a.appendChild(el);
			wrapper.appendChild(a);
			container.appendChild(wrapper);
		});
	}

	function renderMatchDetail(containerId, match) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		if (!match) {
			setState(containerId.replace('summary','error') || '', 'Match introuvable', 'error');
			return;
		}

		const html = document.createElement('div');
		html.className = 'p-4 rounded-lg bg-gray-900/40 border';
		html.innerHTML = `
			<div class="flex items-center justify-between mb-3">
				<div>
					<h2 class="text-2xl font-bold">${match.home.name} <span class="text-sm text-gray-400">vs</span> ${match.away.name}</h2>
					<div class="text-sm text-gray-400">${match.competition ? match.competition.name : ''}</div>
				</div>
				<div class="text-right">
					<div class="text-sm text-gray-300">${formatDate(match.date)}</div>
					<div class="text-lg font-semibold">${match.score && match.score.home != null ? match.score.home + ' - ' + match.score.away : '—'}</div>
					<div class="text-sm text-gray-400">${match.status}</div>
				</div>
			</div>
			<div class="mt-2 text-sm text-gray-300">Détails et événements disponibles si fournis par l'API.</div>
		`;

		container.appendChild(html);
	}

	function renderCompetitions(containerId, competitions = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		if (!competitions.length) {
			setState(containerId.replace('-list','-empty') || '', 'Aucune compétition', 'empty');
			return;
		}
		competitions.forEach(c => {
			const el = document.createElement('div');
			el.className = 'mb-3 p-3 rounded-lg border bg-gray-900/40';
			el.innerHTML = `<strong>${c.name}</strong><div class="text-sm text-gray-400">${c.country || ''}</div>`;
			container.appendChild(el);
		});
	}

	function renderTeams(containerId, teams = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		if (!teams.length) {
			setState(containerId.replace('-list','-empty') || '', 'Aucune équipe', 'empty');
			return;
		}
		teams.forEach(t => {
			const el = document.createElement('div');
			el.className = 'mb-2 p-2 rounded border bg-gray-900/30';
			el.textContent = t.name + (t.country ? ' • ' + t.country : '');
			container.appendChild(el);
		});
	}

	function renderStandings(containerId, rows = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = '';
		if (!rows.length) {
			setState(containerId.replace('-table','-empty') || '', 'Aucun classement', 'empty');
			return;
		}
		const table = document.createElement('table');
		table.className = 'w-full text-left';
		table.innerHTML = `
		<thead class="text-sm text-gray-400"><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>N</th><th>D</th><th>Pts</th></tr></thead>
		<tbody></tbody>`;
		const tbody = table.querySelector('tbody');
		rows.forEach(r => {
			const tr = document.createElement('tr');
			tr.className = 'border-t border-gray-800';
			tr.innerHTML = `<td>${r.position}</td><td>${r.team}</td><td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td><td>${r.points}</td>`;
			tbody.appendChild(tr);
		});
		container.appendChild(table);
	}

	window.FootballHubUI = {
		setState,
		clearState,
		renderMatches,
		renderCompetitions,
		renderStandings,
		renderTeams
	};
})();
