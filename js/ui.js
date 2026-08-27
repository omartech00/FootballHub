/*
  UI layer for FootballHub.
  Provides accessible DOM rendering helpers with Tailwind CSS,
  team logos, match status badges, events, statistics, and standings.
*/
(function () {
	"use strict";

	function setState(containerId, message, type) {
		const container = document.getElementById(containerId);
		if (!container) return;

		container.className = "state-box";
		container.classList.remove("hidden");
		if (type === "loading") {
			container.classList.add("state-loading");
			container.innerHTML = `<span class="inline-block animate-spin mr-2">⚽</span> ${message || "Chargement..."}`;
		} else if (type === "error") {
			container.classList.add("state-error");
			container.innerHTML = `⚠️ ${message || "Une erreur est survenue"}`;
		} else if (type === "empty") {
			container.classList.add("state-empty");
			container.innerHTML = `ℹ️ ${message || "Aucune donnée disponible"}`;
		} else {
			container.textContent = message || "";
		}
	}

	function clearState(containerId) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.className = "hidden";
		container.innerHTML = "";
	}

	function formatDate(iso) {
		try {
			const d = new Date(iso);
			if (isNaN(d.getTime())) return iso || "—";
			return d.toLocaleDateString("fr-FR", {
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit"
			});
		} catch (e) {
			return iso || "—";
		}
	}

	function getStatusBadge(status, elapsed) {
		const st = String(status || "").toUpperCase();
		if (["FT", "AET", "PEN", "AWD", "WO"].includes(st)) {
			return `<span class="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950/80 text-emerald-400 border border-emerald-600/40">Terminé</span>`;
		}
		if (["1H", "2H", "HT", "ET", "P", "LIVE"].includes(st)) {
			return `<span class="px-2 py-0.5 text-xs font-semibold rounded bg-rose-950/90 text-rose-400 border border-rose-500/60 animate-pulse">🔴 Direct ${elapsed ? `${elapsed}'` : ''}</span>`;
		}
		if (["PST", "CANC", "ABD"].includes(st)) {
			return `<span class="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 text-amber-400 border border-amber-600/40">Reporté</span>`;
		}
		return `<span class="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">À venir</span>`;
	}

	function getBasePath() {
		return window.location.pathname.includes("/pages/") ? "" : "pages/";
	}

	function renderMatches(containerId, matches = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!matches || !matches.length) {
			const emptyId = containerId.replace("-list", "-empty");
			setState(emptyId, "Aucun match trouvé.", "empty");
			return;
		}

		const base = getBasePath();
		matches.forEach(m => {
			const card = document.createElement("article");
			card.className = "p-4 bg-slate-900/60 hover:bg-slate-800/80 transition-all rounded-xl border border-slate-700/60 hover:border-emerald-500/50 shadow-md";

			const scoreDisplay = (m.score && m.score.home !== null && m.score.away !== null)
				? `<span class="text-xl font-extrabold text-emerald-400 bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-700">${m.score.home} - ${m.score.away}</span>`
				: `<span class="text-sm font-semibold text-slate-400 bg-slate-950/50 px-2.5 py-1 rounded border border-slate-800">VS</span>`;

			const compName = m.competition?.name || "Football";
			const compLogo = m.competition?.logo ? `<img src="${m.competition.logo}" alt="" class="w-4 h-4 object-contain" />` : "";

			card.innerHTML = `
				<a href="${base}match-detail.html?id=${encodeURIComponent(m.id)}" class="block group">
					<div class="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800">
						<span class="flex items-center gap-1.5 font-medium text-slate-300">
							${compLogo}
							<span>${compName}</span>
						</span>
						<div class="flex items-center gap-2">
							<span>${formatDate(m.date)}</span>
							${getStatusBadge(m.status, m.elapsed)}
						</div>
					</div>

					<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
						<div class="flex items-center justify-end gap-3 text-right">
							<span class="font-bold text-slate-100 group-hover:text-emerald-400 transition text-sm sm:text-base">${m.home.name}</span>
							${m.home.logo ? `<img src="${m.home.logo}" alt="${m.home.name}" class="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" onerror="this.style.display='none'" />` : '<div class="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs">⚽</div>'}
						</div>

						<div class="text-center px-2">
							${scoreDisplay}
						</div>

						<div class="flex items-center justify-start gap-3 text-left">
							${m.away.logo ? `<img src="${m.away.logo}" alt="${m.away.name}" class="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0" onerror="this.style.display='none'" />` : '<div class="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs">⚽</div>'}
							<span class="font-bold text-slate-100 group-hover:text-emerald-400 transition text-sm sm:text-base">${m.away.name}</span>
						</div>
					</div>

					${m.venue?.name ? `
						<div class="mt-2 text-center text-xs text-slate-500">
							📍 ${m.venue.name}${m.venue.city ? `, ${m.venue.city}` : ''}
						</div>
					` : ''}
				</a>
			`;

			container.appendChild(card);
		});
	}

	function renderMatchDetail(summaryId, match) {
		const container = document.getElementById(summaryId);
		if (!container) return;
		container.innerHTML = "";

		if (!match) {
			setState(summaryId.replace("summary", "error") || "match-events-error", "Match introuvable", "error");
			return;
		}

		const isFinished = ["FT", "AET", "PEN"].includes(match.status);
		const scoreDisplay = (match.score && match.score.home !== null && match.score.away !== null)
			? `${match.score.home} - ${match.score.away}`
			: "—";

		// Match Header / Summary
		const summaryBox = document.createElement("div");
		summaryBox.className = "p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl";
		summaryBox.innerHTML = `
			<div class="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800 text-sm">
				<div class="flex items-center gap-2 text-slate-300">
					${match.competition?.logo ? `<img src="${match.competition.logo}" alt="" class="w-6 h-6 object-contain" />` : ''}
					<span class="font-semibold">${match.competition?.name || 'Match de football'}</span>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-slate-400">📅 ${formatDate(match.date)}</span>
					${getStatusBadge(match.status, match.elapsed)}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center my-4">
				<div class="flex flex-col items-center gap-3">
					${match.home.logo ? `<img src="${match.home.logo}" alt="${match.home.name}" class="w-20 h-20 object-contain drop-shadow-md" />` : '<div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl">⚽</div>'}
					<h3 class="text-xl font-bold text-slate-100">${match.home.name}</h3>
				</div>

				<div class="flex flex-col items-center gap-2">
					<div class="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400 bg-slate-900/90 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner">
						${scoreDisplay}
					</div>
					<div class="text-xs uppercase tracking-wider text-slate-400 mt-1">${match.statusLong || (isFinished ? 'Score Final' : 'Match à venir')}</div>
				</div>

				<div class="flex flex-col items-center gap-3">
					${match.away.logo ? `<img src="${match.away.logo}" alt="${match.away.name}" class="w-20 h-20 object-contain drop-shadow-md" />` : '<div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl">⚽</div>'}
					<h3 class="text-xl font-bold text-slate-100">${match.away.name}</h3>
				</div>
			</div>

			<div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap justify-around gap-4 text-xs text-slate-400 text-center">
				<div>📍 <strong>Stade :</strong> ${match.venue?.name || 'Non précisé'}${match.venue?.city ? ` (${match.venue.city})` : ''}</div>
				<div>👨‍⚖️ <strong>Arbitre :</strong> ${match.referee || 'Non communiqué'}</div>
			</div>
		`;
		container.appendChild(summaryBox);

		// Render Events (if present in API response)
		const eventsContainer = document.getElementById("match-events-list");
		if (eventsContainer) {
			eventsContainer.innerHTML = "";
			if (match.events && match.events.length) {
				const ul = document.createElement("div");
				ul.className = "grid gap-2";
				match.events.forEach(e => {
					let icon = "⚡";
					if (e.type === "Goal") icon = "⚽";
					else if (e.type === "Card") icon = e.detail?.includes("Red") ? "🟥" : "🟨";
					else if (e.type === "subst") icon = "🔄";

					const item = document.createElement("div");
					item.className = "p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-between text-sm";
					item.innerHTML = `
						<div class="flex items-center gap-3">
							<span class="font-bold text-emerald-400 w-10">${e.time?.elapsed || 0}'</span>
							<span class="text-base">${icon}</span>
							<div>
								<span class="font-semibold text-slate-200">${e.player?.name || 'Joueur'}</span>
								<span class="text-xs text-slate-400 ml-2">(${e.team?.name || ''})</span>
								${e.assist?.name ? `<span class="text-xs text-slate-500 block">Passe: ${e.assist.name}</span>` : ''}
							</div>
						</div>
						<div class="text-xs text-slate-400">${e.detail || e.type}</div>
					`;
					ul.appendChild(item);
				});
				eventsContainer.appendChild(ul);
			} else {
				setState("match-events-list", "Aucun événement disponible pour ce match.", "empty");
			}
		}

		// Render Statistics (if present in API response)
		const statsContainer = document.getElementById("match-stats");
		if (statsContainer) {
			statsContainer.innerHTML = "";
			if (match.statistics && match.statistics.length >= 2) {
				const team1 = match.statistics[0];
				const team2 = match.statistics[1];
				const stats1 = team1.statistics || [];
				const stats2 = team2.statistics || [];

				const statKeys = [
					"Ball Possession",
					"Total Shots",
					"Shots on Goal",
					"Fouls",
					"Corner Kicks",
					"Offsides",
					"Yellow Cards",
					"Red Cards"
				];

				const labels = {
					"Ball Possession": "Possession",
					"Total Shots": "Tirs totaux",
					"Shots on Goal": "Tirs cadrés",
					"Fouls": "Fautes",
					"Corner Kicks": "Corners",
					"Offsides": "Hors-jeu",
					"Yellow Cards": "Cartons jaunes",
					"Red Cards": "Cartons rouges"
				};

				const statsGrid = document.createElement("div");
				statsGrid.className = "grid gap-3";

				statKeys.forEach(key => {
					const s1 = stats1.find(s => s.type === key)?.value ?? "0";
					const s2 = stats2.find(s => s.type === key)?.value ?? "0";

					const val1Num = parseInt(String(s1).replace("%", "")) || 0;
					const val2Num = parseInt(String(s2).replace("%", "")) || 0;
					const total = val1Num + val2Num || 1;
					const pct1 = Math.round((val1Num / total) * 100);
					const pct2 = 100 - pct1;

					const row = document.createElement("div");
					row.className = "p-3 bg-slate-900/50 rounded-lg border border-slate-800";
					row.innerHTML = `
						<div class="flex justify-between text-xs font-semibold text-slate-300 mb-1">
							<span>${s1}</span>
							<span class="text-slate-400 font-medium">${labels[key] || key}</span>
							<span>${s2}</span>
						</div>
						<div class="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
							<div class="bg-emerald-500 h-full" style="width: ${pct1}%"></div>
							<div class="bg-blue-500 h-full" style="width: ${pct2}%"></div>
						</div>
					`;
					statsGrid.appendChild(row);
				});
				statsContainer.appendChild(statsGrid);
			} else {
				setState("match-stats", "Statistiques non fournies pour ce match.", "empty");
			}
		}
	}

	function renderCompetitions(containerId, competitions = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!competitions.length) {
			const emptyId = containerId.replace("-list", "-empty");
			setState(emptyId, "Aucune compétition disponible.", "empty");
			return;
		}

		const base = getBasePath();
		const grid = document.createElement("div");
		grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

		competitions.forEach(c => {
			const card = document.createElement("div");
			card.className = "p-4 bg-slate-900/60 hover:bg-slate-800/80 transition-all rounded-xl border border-slate-700/60 hover:border-emerald-500/50 shadow-md flex items-center justify-between";
			card.innerHTML = `
				<a href="${base}competition-detail.html?id=${encodeURIComponent(c.id)}" class="flex items-center gap-4 w-full">
					${c.logo ? `<img src="${c.logo}" alt="${c.name}" class="w-12 h-12 object-contain bg-slate-950/60 p-1.5 rounded-lg border border-slate-800" onerror="this.style.display='none'" />` : '<div class="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-xl">🏆</div>'}
					<div class="flex-1 min-w-0">
						<h3 class="font-bold text-slate-100 hover:text-emerald-400 transition truncate">${c.name}</h3>
						<div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
							${c.flag ? `<img src="${c.flag}" alt="" class="w-4 h-3 object-cover rounded-sm" />` : ''}
							<span>${c.country || "International"}</span>
						</div>
					</div>
					<span class="text-slate-500 text-lg">➔</span>
				</a>
			`;
			grid.appendChild(card);
		});

		container.appendChild(grid);
	}

	function renderCompetitionDetail(containerId, comp) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!comp) {
			setState(containerId.replace("summary", "error") || "standings-error", "Compétition introuvable", "error");
			return;
		}

		const card = document.createElement("div");
		card.className = "p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl flex flex-wrap items-center justify-between gap-4";
		card.innerHTML = `
			<div class="flex items-center gap-5">
				${comp.logo ? `<img src="${comp.logo}" alt="${comp.name}" class="w-16 h-16 object-contain bg-slate-950/80 p-2 rounded-xl border border-slate-800" />` : '<div class="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-3xl">🏆</div>'}
				<div>
					<h2 class="text-2xl font-bold text-slate-100">${comp.name}</h2>
					<div class="text-sm text-slate-400 flex items-center gap-2 mt-1">
						${comp.flag ? `<img src="${comp.flag}" alt="" class="w-4 h-3 object-cover rounded-sm" />` : ''}
						<span>Pays : <strong>${comp.country || 'International'}</strong></span>
						<span>• Type : <strong>${comp.type || 'Ligue'}</strong></span>
					</div>
				</div>
			</div>
			<div class="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
				Saison active : <strong>2024 / 2025</strong>
			</div>
		`;
		container.appendChild(card);
	}

	function renderStandings(containerId, rows = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!rows || !rows.length) {
			const emptyId = containerId.replace("-table", "-empty");
			setState(emptyId, "Aucun classement disponible pour cette compétition.", "empty");
			return;
		}

		const base = getBasePath();
		const tableWrapper = document.createElement("div");
		tableWrapper.className = "overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-lg";

		const table = document.createElement("table");
		table.className = "w-full text-left text-sm text-slate-300";
		table.innerHTML = `
			<thead class="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
				<tr>
					<th class="px-3 py-3 text-center">#</th>
					<th class="px-4 py-3">Équipe</th>
					<th class="px-3 py-3 text-center" title="Matchs joués">J</th>
					<th class="px-3 py-3 text-center" title="Victoires">V</th>
					<th class="px-3 py-3 text-center" title="Matchs nuls">N</th>
					<th class="px-3 py-3 text-center" title="Défaites">D</th>
					<th class="px-3 py-3 text-center" title="Buts pour : Buts contre">Buts</th>
					<th class="px-3 py-3 text-center" title="Différence de buts">Diff</th>
					<th class="px-4 py-3 text-center font-bold text-emerald-400" title="Points">Pts</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-800/60"></tbody>
		`;

		const tbody = table.querySelector("tbody");
		rows.forEach((r, idx) => {
			const tr = document.createElement("tr");
			tr.className = "hover:bg-slate-800/50 transition";

			const diffFormatted = r.goalsDiff > 0 ? `+${r.goalsDiff}` : `${r.goalsDiff}`;
			const diffClass = r.goalsDiff > 0 ? "text-emerald-400" : (r.goalsDiff < 0 ? "text-rose-400" : "text-slate-400");
			const posBg = idx < 4 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400";

			const teamLink = r.teamId ? `<a href="${base}team-detail.html?id=${encodeURIComponent(r.teamId)}" class="hover:text-emerald-400 transition font-semibold text-slate-100 flex items-center gap-2.5">` : `<div class="flex items-center gap-2.5 font-semibold text-slate-100">`;
			const teamEndLink = r.teamId ? `</a>` : `</div>`;

			tr.innerHTML = `
				<td class="px-3 py-3 text-center">
					<span class="inline-block w-6 h-6 leading-6 rounded-full text-xs text-center ${posBg}">${r.position}</span>
				</td>
				<td class="px-4 py-3 font-medium">
					${teamLink}
						${r.logo ? `<img src="${r.logo}" alt="" class="w-6 h-6 object-contain flex-shrink-0" onerror="this.style.display='none'" />` : ''}
						<span>${r.team}</span>
					${teamEndLink}
				</td>
				<td class="px-3 py-3 text-center text-slate-300">${r.played}</td>
				<td class="px-3 py-3 text-center text-slate-300">${r.win}</td>
				<td class="px-3 py-3 text-center text-slate-300">${r.draw}</td>
				<td class="px-3 py-3 text-center text-slate-300">${r.loss}</td>
				<td class="px-3 py-3 text-center text-slate-400 text-xs">${r.goalsFor}:${r.goalsAgainst}</td>
				<td class="px-3 py-3 text-center font-semibold ${diffClass}">${diffFormatted}</td>
				<td class="px-4 py-3 text-center font-black text-emerald-400 text-base">${r.points}</td>
			`;
			tbody.appendChild(tr);
		});

		tableWrapper.appendChild(table);
		container.appendChild(tableWrapper);
	}

	function renderTeams(containerId, teams = []) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!teams || !teams.length) {
			const emptyId = containerId.replace("-list", "-empty");
			setState(emptyId, "Aucune équipe trouvée.", "empty");
			return;
		}

		const base = getBasePath();
		const grid = document.createElement("div");
		grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4";

		teams.forEach(t => {
			const card = document.createElement("div");
			card.className = "p-4 bg-slate-900/60 hover:bg-slate-800/80 transition-all rounded-xl border border-slate-700/60 hover:border-emerald-500/50 shadow-md text-center";
			card.innerHTML = `
				<a href="${base}team-detail.html?id=${encodeURIComponent(t.id)}" class="flex flex-col items-center gap-3 group">
					${t.logo ? `<img src="${t.logo}" alt="${t.name}" class="w-16 h-16 object-contain group-hover:scale-105 transition-transform" onerror="this.style.display='none'" />` : '<div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl">⚽</div>'}
					<div>
						<h3 class="font-bold text-slate-100 group-hover:text-emerald-400 transition text-sm sm:text-base">${t.name}</h3>
						<div class="text-xs text-slate-400 mt-1">${t.country || 'Club'} ${t.founded ? `• Fondé en ${t.founded}` : ''}</div>
					</div>
				</a>
			`;
			grid.appendChild(card);
		});

		container.appendChild(grid);
	}

	function renderTeamDetail(containerId, team) {
		const container = document.getElementById(containerId);
		if (!container) return;
		container.innerHTML = "";

		if (!team) {
			setState(containerId.replace("summary", "error") || "team-recent-error", "Équipe non trouvée", "error");
			return;
		}

		const el = document.createElement("div");
		el.className = "p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl";
		el.innerHTML = `
			<div class="flex flex-wrap items-center justify-between gap-6">
				<div class="flex items-center gap-5">
					${team.logo ? `<img src="${team.logo}" alt="${team.name}" class="w-20 h-20 object-contain bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shadow-md" />` : '<div class="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl">⚽</div>'}
					<div>
						<h2 class="text-3xl font-extrabold text-slate-100">${team.name}</h2>
						<div class="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-1">
							<span>🌍 Pays : <strong>${team.country || '—'}</strong></span>
							${team.founded ? `<span>• 📅 Fondé en : <strong>${team.founded}</strong></span>` : ''}
							${team.code ? `<span>• 🏷️ Code : <strong>${team.code}</strong></span>` : ''}
						</div>
					</div>
				</div>

				${team.venue?.name ? `
					<div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800 max-w-sm text-xs text-slate-300">
						<div class="font-bold text-slate-100 mb-1 text-sm">🏟️ Stade & Infrastructures</div>
						<div>Nom : <strong>${team.venue.name}</strong></div>
						${team.venue.city ? `<div>Ville : <strong>${team.venue.city}</strong></div>` : ''}
						${team.venue.capacity ? `<div>Capacité : <strong>${team.venue.capacity.toLocaleString()} places</strong></div>` : ''}
						${team.venue.surface ? `<div>Surface : <strong>${team.venue.surface}</strong></div>` : ''}
					</div>
				` : ''}
			</div>
		`;
		container.appendChild(el);
	}

	window.FootballHubUI = {
		setState,
		clearState,
		formatDate,
		getStatusBadge,
		renderMatches,
		renderCompetitions,
		renderStandings,
		renderTeams,
		renderTeamDetail,
		renderCompetitionDetail,
		renderMatchDetail
	};
})();

