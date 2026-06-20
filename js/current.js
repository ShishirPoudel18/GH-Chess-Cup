// js/current.js

window.addEventListener("DOMContentLoaded", () => {
    // Process tracking logic via global engine
    if (typeof processSeasonData === "function") {
        processSeasonData();
    }
    renderCurrentDashboard();
});

function renderCurrentDashboard() {
    const store = getStore();
    if (!store) return;

    const players = Object.values(store.players);
    const matches = store.currentMatches || [];

    // ==========================================
    // 1. RENDER LIVE LEADERBOARD (Top of page)
    // ==========================================
    // Sorted by Wins, then GHPS
    const leaderboardPlayers = [...players].sort((a, b) => {
        if (b.currentWins !== a.currentWins) return b.currentWins - a.currentWins;
        return b.currentGHPS - a.currentGHPS;
    });

    let lbHtml = `<table>
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Played</th>
            <th>Won</th>
            <th>GHelo</th>
            <th>GHPS</th>
        </tr>`;
    
    leaderboardPlayers.forEach((p, index) => {
        const played = p.currentWins + p.currentLosses + p.currentDraws;
        lbHtml += `<tr>
            <td><b>#${index + 1}</b></td>
            <td><strong>${p.name}</strong></td>
            <td>${played}</td>
            <td style="color: #10b981;"><b>${p.currentWins}</b></td>
            <td>${Math.round(p.ghelo)}</td>
            <td>${p.currentGHPS.toFixed(3)}</td>
        </tr>`;
    });
    lbHtml += `</table>`;
    document.getElementById("live-leaderboard").innerHTML = lbHtml;

    // ==========================================
    // 2. RENDER FOUR GROUP POINTS TABLES
    // ==========================================
    const groups = ["A", "B", "C", "D"];
    let tablesHtml = "";

    groups.forEach(grp => {
        const groupPlayers = players.filter(p => p.currentGroup === grp)
            .sort((a, b) => {
                if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
                return b.currentGHPS - a.currentGHPS;
            });

        tablesHtml += `<h3>Group ${grp} Standings</h3>`;
        tablesHtml += `<table>
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Played</th>
                <th>Won</th>
                <th>Lost</th>
                <th>Drawn</th>
                <th>Points</th>
                <th>GHelo</th>
                <th>GHPS</th>
            </tr>`;
        
        groupPlayers.forEach((p, idx) => {
            const played = p.currentWins + p.currentLosses + p.currentDraws;
            tablesHtml += `<tr>
                <td><b>${idx + 1}</b></td>
                <td><strong>${p.name}</strong></td>
                <td>${played}</td>
                <td>${p.currentWins}</td>
                <td>${p.currentLosses}</td>
                <td>${p.currentDraws}</td>
                <td style="color: #3b82f6;"><b>${p.currentPoints.toFixed(1)}</b></td>
                <td>${Math.round(p.ghelo)}</td>
                <td>${p.currentGHPS.toFixed(3)}</td>
            </tr>`;
        });
        tablesHtml += `</table>`;
    });
    document.getElementById("group-tables").innerHTML = tablesHtml;

    // ==========================================
    // 3. RENDER THE KNOCKOUT TREE DIAGRAM
    // ==========================================
    const qf1 = matches.find(m => m.stage === "QF1") || {};
    const qf2 = matches.find(m => m.stage === "QF2") || {};
    const qf3 = matches.find(m => m.stage === "QF3") || {};
    const qf4 = matches.find(m => m.stage === "QF4") || {};
    const sf1 = matches.find(m => m.stage === "SF1") || {};
    const sf2 = matches.find(m => m.stage === "SF2") || {};
    const fnl = matches.find(m => m.stage === "Final") || {};

    const formatNode = (node) => {
        let p1 = node.white || "TBD";
        let p2 = node.black || "TBD";
        if(node.result === "1-0") p1 = `<span class="winner">🏆 ${p1}</span>`;
        if(node.result === "0-1") p2 = `<span class="winner">🏆 ${p2}</span>`;
        return `<div>${p1}</div><div>vs</div><div>${p2}</div>`;
    };

    let treeHtml = `
    <div class="bracket-container">
        <!-- Quarter Finals Column (8 players in 4 boxes) -->
        <div class="bracket-column">
            <div class="bracket-title">Quarter Finals</div>
            <div class="bracket-box"><strong>QF1 (A1 vs B2)</strong>${formatNode(qf1)}</div>
            <div class="bracket-box"><strong>QF2 (B1 vs A2)</strong>${formatNode(qf2)}</div>
            <div class="bracket-box"><strong>QF3 (C1 vs D2)</strong>${formatNode(qf3)}</div>
            <div class="bracket-box"><strong>QF4 (D1 vs C2)</strong>${formatNode(qf4)}</div>
        </div>
        
        <!-- Semi Finals Column (4 players in 2 boxes) -->
        <div class="bracket-column">
            <div class="bracket-title">Semi Finals</div>
            <div class="bracket-box"><strong>SF1 (QF1 vs QF2)</strong>${formatNode(sf1)}</div>
            <div class="bracket-box"><strong>SF2 (QF3 vs QF4)</strong>${formatNode(sf2)}</div>
        </div>

        <!-- Grand Finals Column (2 players in 1 box) -->
        <div class="bracket-column">
            <div class="bracket-title">Grand Finals</div>
            <div class="bracket-box" style="border-color: #eab308;"><strong>Grand Final</strong>${formatNode(fnl)}</div>
        </div>
    </div>`;
    document.getElementById("knockout-bracket").innerHTML = treeHtml;

    // ==========================================
    // 4. RENDER REMAINING FIXTURES (Fixed Order)
    // ==========================================
    let schedHtml = "";
    groups.forEach(grp => {
        const groupSched = matches.filter(m => m.stage === "group" && m.group === grp && m.result === "pending");
        if(groupSched.length > 0) {
            schedHtml += `<h3>Group ${grp} Remaining Schedule</h3>`;
            groupSched.forEach(m => {
                schedHtml += `<div class="match-item">
                    <p><strong>Match #${m.matchNo}:</strong> ${m.white} vs ${m.black}</p>
                </div>`;
            });
        }
    });
    document.getElementById("group-schedules").innerHTML = schedHtml || "<p>All group matches have been completed!</p>";

    // ==========================================
    // 5. RENDER COMPLETED MATCH RESULTS
    // ==========================================
    let resHtml = "";
    
    // Group Results
    groups.forEach(grp => {
        const groupRes = matches.filter(m => m.stage === "group" && m.group === grp && m.result !== "pending");
        if(groupRes.length > 0) {
            resHtml += `<h3>Group ${grp} Results</h3>`;
            groupRes.forEach(m => {
                let outcomeText = m.result === "1-0" ? `${m.white} won` : (m.result === "0-1" ? `${m.black} won` : "Draw");
                if (m.method) outcomeText += ` by ${m.method}`;
                resHtml += `<div class="match-item" style="border-left-color: #10b981;">
                    <p><strong>Match #${m.matchNo}:</strong> ${m.white} vs ${m.black} [${m.date || "No Date"}]</p>
                    <p style="color: #cbd5e1; font-size: 0.9rem;">Outcome: ${outcomeText}.</p>
                </div>`;
            });
        }
    });

    // Knockout Results
    const koRes = matches.filter(m => m.stage !== "group" && m.result !== "pending");
    if(koRes.length > 0) {
        resHtml += `<h3>Knockouts Results</h3>`;
        koRes.forEach(m => {
            let outcomeText = m.result === "1-0" ? `${m.white} won` : `${m.black} won`;
            if (m.method) outcomeText += ` by ${m.method}`;
            resHtml += `<div class="match-item" style="border-left-color: #eab308;">
                <p><strong>${m.stage}:</strong> ${m.white} vs ${m.black} [${m.date || "No Date"}]</p>
                <p style="color: #cbd5e1; font-size: 0.9rem;">Outcome: ${outcomeText}.</p>
            </div>`;
        });
    }

    document.getElementById("completed-results").innerHTML = resHtml || "<p>No matches completed yet this season.</p>";
}