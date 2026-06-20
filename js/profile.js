// js/profile.js

window.addEventListener("DOMContentLoaded", () => {
    if (typeof processSeasonData === "function") {
        processSeasonData();
    }
    populateSearchDropdown();
});

function populateSearchDropdown() {
    const store = getStore();
    if (!store) return;
    
    const dropdown = document.getElementById("profile-search-select");
    const names = Object.keys(store.players).sort();
    
    names.forEach(name => {
        let opt = document.createElement("option");
        opt.value = name;
        opt.innerText = name;
        dropdown.appendChild(opt);
    });
}

function loadPlayerProfile() {
    const name = document.getElementById("profile-search-select").value;
    const container = document.getElementById("profile-output");
    
    if (!name) {
        container.innerHTML = "";
        return;
    }

    const store = getStore();
    const p = store.players[name];

    let totalPlayed = p.allTimePlayed + (p.currentWins + p.currentLosses + p.currentDraws);
    let totalWon = p.allTimeWon + p.currentWins;
    let totalLost = p.allTimeLost + p.currentLosses;
    let totalDrawn = p.allTimeDrawn + p.currentDraws;

    let html = `
    <div class="box" style="background:#1e293b; border-radius:12px; padding:30px; border:1px solid #334155;">
        <h2 style="margin-top:0; color:#3b82f6; border-left:4px solid #3b82f6; padding-left:10px;">${p.name}</h2>
        <table style="margin-top:15px;">
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td><strong>Total Matches Played</strong></td><td>${totalPlayed}</td></tr>
            <tr><td><strong style="color:#10b981;">Matches Won</strong></td><td>${totalWon}</td></tr>
            <tr><td><strong style="color:#ef4444;">Matches Lost</strong></td><td>${totalLost}</td></tr>
            <tr><td><strong>Matches Drawn</strong></td><td>${totalDrawn}</td></tr>
            <tr><td><strong style="color:#3b82f6;">Current GHelo</strong></td><td><b>${Math.round(p.ghelo)}</b></td></tr>
            <tr><td><strong style="color:#eab308;">Peak Top GHelo</strong></td><td><b>${Math.round(p.topGHelo)}</b></td></tr>
        </table>
        
        <h3 style="margin:25px 0 10px 0; color:#e2e8f0;">Active Season Context</h3>
        <p><b>Current Assigned Group:</b> Group ${p.currentGroup || "N/A"}</p>
        <p><b>Current Tournament GHPS:</b> ${p.currentGHPS.toFixed(3)}</p>
        
        <h3 style="margin:25px 0 10px 0; color:#e2e8f0;">Match History (Current Season Log)</h3>`;

    const personalMatches = (store.currentMatches || []).filter(m => (m.white === name || m.black === name) && m.result !== "pending");

    if (personalMatches.length === 0) {
        html += `<p style="color:#64748b; font-style:italic;">No live matches registered for this player in the current tracking logs.</p>`;
    } else {
        personalMatches.forEach(m => {
            let role = m.white === name ? "White" : "Black";
            let opponent = m.white === name ? m.black : m.white;
            let status = "Drawn";
            
            if (m.result === "1-0") status = (role === "White") ? "Won" : "Lost";
            if (m.result === "0-1") status = (role === "Black") ? "Won" : "Lost";
            
            let colorMap = status === "Won" ? "#10b981" : (status === "Lost" ? "#ef4444" : "#94a3b8");

            html += `
                <div class="match-item" style="border-left-color:${colorMap}; background:#0f172a;">
                    <p><strong>Stage:</strong> ${m.stage === 'group' ? 'Group ' + m.group : m.stage} | <b>Date:</b> ${m.date}</p>
                    <p>As ${role} vs <b>${opponent}</b> &rarr; <b style="color:${colorMap};">${status}</b> by ${m.method || 'N/A'}</p>
                </div>`;
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}