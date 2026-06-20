// js/stats.js

window.addEventListener("DOMContentLoaded", () => {
    if (typeof processSeasonData === "function") {
        processSeasonData();
    }
    renderStats('rank');
});

function renderStats(mode) {
    const store = getStore();
    if (!store) return;

    // Build lists combining base metrics + current season active shifts
    let playersList = Object.values(store.players).map(p => {
        let totalPlayed = p.allTimePlayed + (p.currentWins + p.currentLosses + p.currentDraws);
        let totalWon = p.allTimeWon + p.currentWins;
        let totalLost = p.allTimeLost + p.currentLosses;
        let totalDrawn = p.allTimeDrawn + p.currentDraws;
        let winPct = totalPlayed > 0 ? (totalWon / totalPlayed) * 100 : 0;

        return {
            name: p.name,
            played: totalPlayed,
            won: totalWon,
            lost: totalLost,
            drawn: totalDrawn,
            winPct: winPct,
            ghelo: p.ghelo,
            topGHelo: p.topGHelo
        };
    });

    const buttons = ['rank', 'wins', 'pct', 'helo'];
    buttons.forEach(b => document.getElementById(`btn-${b}`).classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');

    let titleText = "";
    if (mode === 'rank') {
        titleText = "Player's Ranking (Sorted by Current GHelo)";
        playersList.sort((a, b) => b.ghelo - a.ghelo);
    } else if (mode === 'wins') {
        titleText = "Most Wins Leaderboard";
        playersList.sort((a, b) => b.won - a.won);
    } else if (mode === 'pct') {
        titleText = "Best Win Percentage Leaderboard";
        playersList.sort((a, b) => b.winPct - a.winPct);
    } else if (mode === 'helo') {
        titleText = "Peak Historical Top GHelo Record";
        playersList.sort((a, b) => b.topGHelo - a.topGHelo);
    }
    
    document.getElementById("stats-title").innerText = titleText;

    let html = `<table>
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Played</th>
            <th>Won</th>
            <th>Lost</th>
            <th>Drawn</th>
            <th>Win %</th>
            <th>GHelo</th>
            <th>Top GHelo</th>
        </tr>`;

    playersList.forEach((p, index) => {
        html += `<tr>
            <td><b>#${index + 1}</b></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.played}</td>
            <td style="color:#10b981;"><b>${p.won}</b></td>
            <td>${p.lost}</td>
            <td>${p.drawn}</td>
            <td>${p.winPct.toFixed(1)}%</td>
            <td style="color:#3b82f6;"><b>${Math.round(p.ghelo)}</b></td>
            <td style="color:#eab308;"><b>${Math.round(p.topGHelo)}</b></td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById("stats-table-container").innerHTML = html;
}