// State Management
let appState = {
    currentActiveSeason: 3,
    viewingSeason: 3,
    players: {},
    seasons: {},
    isAdminLoggedIn: false
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    listenToFirebaseData();
});

// Navigation Setup
function setupNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
        });
    });
}

// Firebase Realtime Listener (Sync across internet instantly)
function listenToFirebaseData() {
    db.ref().on("value", snapshot => {
        const data = snapshot.val() || {};
        appState.players = data.players || {};
        appState.seasons = data.seasons || {};
        appState.currentActiveSeason = data.currentActiveSeason || 3;

        renderAllComponents();
    });
}

function renderAllComponents() {
    renderDashboard();
    renderCurrentSeason();
    renderArchiveSeason(appState.viewingSeason);
    renderLeaderboard();
    populatePlayerDropdowns();
}

// 1. DASHBOARD RENDERING
function renderDashboard() {
    const playerArray = Object.values(appState.players);
    document.getElementById("stat-total-players").innerText = playerArray.length;

    let totalMatches = 0;
    playerArray.forEach(p => totalMatches += (p.matches || 0));
    document.getElementById("stat-total-matches").innerText = Math.floor(totalMatches / 2);

    let topPlayer = playerArray.sort((a,b) => (b.ghelo || 800) - (a.ghelo || 800))[0];
    document.getElementById("stat-top-player").innerText = topPlayer ? `${topPlayer.name} (${topPlayer.ghelo})` : "-";

    // Render Upcoming Matches
    const activeSeason = appState.seasons[`season_${appState.currentActiveSeason}`] || {};
    const matches = activeSeason.matches || [];
    const upcoming = matches.filter(m => m.status === 'scheduled');

    const upcomingContainer = document.getElementById("upcoming-matches-list");
    if(upcoming.length === 0) {
        upcomingContainer.innerHTML = `<p class="empty-state">No upcoming matches scheduled.</p>`;
    } else {
        upcomingContainer.innerHTML = upcoming.slice(0, 5).map(m => `
            <div class="match-card">
                <div class="match-header">Match ${m.id} • ${m.stage} ${m.group ? `(Group ${m.group})` : ''}</div>
                <div class="match-body">${m.white} vs ${m.black}</div>
                <div class="match-status">Status: Upcoming</div>
            </div>
        `).join('');
    }
}

// 2. CURRENT SEASON RENDERING
function renderCurrentSeason() {
    renderSeasonDetails(appState.currentActiveSeason, "current-schedules", "current-points-tables", "current-bracket");
}

function switchSeasonView(seasonNum) {
    appState.viewingSeason = seasonNum;
    document.querySelectorAll(".season-select-btn").forEach((btn, idx) => {
        btn.classList.toggle("active-season-btn", (idx + 1) === seasonNum);
    });
    renderArchiveSeason(seasonNum);
}

function renderArchiveSeason(seasonNum) {
    const container = document.getElementById("archive-season-content");
    const seasonData = appState.seasons[`season_${seasonNum}`];

    if (!seasonData) {
        container.innerHTML = `<div class="card"><p class="empty-state">No data to display for Season ${seasonNum}.</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="card">
            <h3><i class="fa-solid fa-list-check"></i> Season ${seasonNum} Matches</h3>
            <div id="arch-schedules-${seasonNum}" class="schedule-grid"></div>
        </div>
        <div class="card">
            <h3><i class="fa-solid fa-table-cells"></i> Points Table</h3>
            <div id="arch-points-${seasonNum}" class="groups-container"></div>
        </div>
        <div class="card">
            <h3><i class="fa-solid fa-sitemap"></i> Knockout Bracket</h3>
            <div id="arch-bracket-${seasonNum}" class="bracket-wrapper"></div>
        </div>
    `;

    renderSeasonDetails(seasonNum, `arch-schedules-${seasonNum}`, `arch-points-${seasonNum}`, `arch-bracket-${seasonNum}`);
}

// Render Generic Season Details
function renderSeasonDetails(seasonNum, schedId, tableId, bracketId) {
    const seasonData = appState.seasons[`season_${seasonNum}`] || {};
    const matches = seasonData.matches || [];
    const groups = seasonData.groups || { A: [], B: [], C: [], D: [] };

    // Matches Render
    const schedContainer = document.getElementById(schedId);
    if (schedContainer) {
        if(matches.length === 0) {
            schedContainer.innerHTML = `<p class="empty-state">No matches recorded for this season.</p>`;
        } else {
            schedContainer.innerHTML = matches.map(m => `
                <div class="match-card">
                    <div class="match-header">Match ${m.id} • ${m.stage} ${m.group ? `(Group ${m.group})` : ''}</div>
                    <div class="match-body">${m.white} vs ${m.black}</div>
                    <div class="match-status">
                        ${m.status === 'completed' ? `<strong>Winner:</strong> ${m.winner} (${m.method || 'Finished'})` : 'Status: Scheduled'}
                    </div>
                </div>
            `).join('');
        }
    }

    // Points Table Render with GHPS & Ties
    const tableContainer = document.getElementById(tableId);
    if (tableContainer) {
        let groupsHtml = '';
        ['A', 'B', 'C', 'D'].forEach(grp => {
            const playerList = groups[grp] || [];
            let stats = playerList.map(name => calculateSeasonPlayerStats(name, matches));
            
            // Sort by Points, then GHPS
            stats.sort((a,b) => b.pts - a.pts || b.ghps - a.ghps);

            groupsHtml += `
                <div class="group-box">
                    <h4>Group ${grp}</h4>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Player</th><th>P</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th>GHPS</th></tr>
                            </thead>
                            <tbody>
                                ${stats.map(s => `
                                    <tr>
                                        <td><strong>${s.name}</strong></td>
                                        <td>${s.p}</td><td>${s.w}</td><td>${s.l}</td><td>${s.d}</td>
                                        <td><strong>${s.pts}</strong></td>
                                        <td>${s.ghps.toFixed(1)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        tableContainer.innerHTML = groupsHtml;
    }

    // Knockout Bracket Render
    const bracketContainer = document.getElementById(bracketId);
    if(bracketContainer) {
        bracketContainer.innerHTML = `
            <div class="bracket-round">
                <h4>Quarter Finals</h4>
                <div class="match-card">QF1: A1 vs B2</div>
                <div class="match-card">QF2: B1 vs A2</div>
                <div class="match-card">QF3: C1 vs D2</div>
                <div class="match-card">QF4: D1 vs C2</div>
            </div>
            <div class="bracket-round">
                <h4>Semi Finals</h4>
                <div class="match-card">SF1: Winner QF1 vs Winner QF3</div>
                <div class="match-card">SF2: Winner QF2 vs Winner QF4</div>
            </div>
            <div class="bracket-round">
                <h4>Final</h4>
                <div class="match-card">Final: Winner SF1 vs Winner SF2</div>
            </div>
        `;
    }
}

// Calculate Season Stats & GHPS
function calculateSeasonPlayerStats(playerName, matches) {
    let p=0, w=0, l=0, d=0, pts=0, ghps=0;
    matches.filter(m => m.status === 'completed' && (m.white === playerName || m.black === playerName)).forEach(m => {
        p++;
        const isWhite = m.white === playerName;
        const actualScore = m.winner === playerName ? 1 : (m.winner === 'Draw' ? 0.5 : 0);
        
        if (actualScore === 1) w++;
        else if (actualScore === 0) l++;
        else d++;

        pts += actualScore;
        
        // GHPS calculation: Sum of (S - E)
        const expectedScore = 0.5; // Baseline expected
        ghps += (actualScore - expectedScore);
    });
    return { name: playerName, p, w, l, d, pts, ghps };
}

// 4. LEADERBOARD RENDERING
function renderLeaderboard() {
    const container = document.getElementById("alltime-leaderboard-container");
    const sortBy = document.getElementById("leaderboard-sort").value;
    let players = Object.values(appState.players);

    players.sort((a,b) => {
        if(sortBy === 'wins') return (b.wins || 0) - (a.wins || 0);
        if(sortBy === 'matches') return (b.matches || 0) - (a.matches || 0);
        if(sortBy === 'winrate') {
            const wrA = a.matches ? (a.wins / a.matches) : 0;
            const wrB = b.matches ? (b.wins / b.matches) : 0;
            return wrB - wrA;
        }
        return (b.ghelo || 800) - (a.ghelo || 800);
    });

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th><th>Player</th><th>Matches</th><th>Won</th><th>Lost</th><th>Drawn</th><th>Win %</th><th>GHelo</th>
                </tr>
            </thead>
            <tbody>
                ${players.map((p, idx) => {
                    const wr = p.matches ? ((p.wins / p.matches) * 100).toFixed(0) : 0;
                    return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.matches || 0}</td>
                            <td>${p.wins || 0}</td>
                            <td>${p.losses || 0}</td>
                            <td>${p.draws || 0}</td>
                            <td>${wr}%</td>
                            <td><strong>${p.ghelo || 800}</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// ADMIN AUTHENTICATION
function loginAdmin() {
    const pass = document.getElementById("admin-pass-input").value;
    if(pass === "pulchowk123") { // Change Password here
        appState.isAdminLoggedIn = true;
        document.getElementById("admin-login-card").classList.add("hidden");
        document.getElementById("admin-panel").classList.remove("hidden");
        populateAdminSeasonDropdowns();
    } else {
        document.getElementById("login-error").innerText = "Invalid Password!";
    }
}

function logoutAdmin() {
    appState.isAdminLoggedIn = false;
    document.getElementById("admin-login-card").classList.remove("hidden");
    document.getElementById("admin-panel").classList.add("hidden");
}

function switchAdminSubTab(tabName) {
    document.querySelectorAll(".admin-sub-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".admin-tab-btn").forEach(el => el.classList.remove("active"));
    document.getElementById(`admin-sub-${tabName}`).classList.add("active");
}

function populateAdminSeasonDropdowns() {
    const options = [1,2,3,4,5,6,7,8].map(s => `<option value="${s}">Season ${s}</option>`).join('');
    document.getElementById("result-season-select").innerHTML = options;
    document.getElementById("schedule-season-select").innerHTML = options;
    document.getElementById("setup-season-select").innerHTML = options;
    document.getElementById("result-season-select").value = appState.currentActiveSeason;
    populateMatchDropdown();
    renderGroupSetupForm();
}

function populatePlayerDropdowns() {
    const playerOpts = Object.values(appState.players).map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    document.getElementById("schedule-white-select").innerHTML = playerOpts;
    document.getElementById("schedule-black-select").innerHTML = playerOpts;
    document.getElementById("h2h-player-1").innerHTML = playerOpts;
    document.getElementById("h2h-player-2").innerHTML = playerOpts;
    document.getElementById("corr-player-select").innerHTML = playerOpts;
}

// ADMIN ACTION: SUBMIT MATCH RESULT (GHelo update K=50)
function submitMatchResult() {
    const seasonNum = document.getElementById("result-season-select").value;
    const matchId = parseInt(document.getElementById("result-match-select").value);
    const outcome = document.getElementById("result-outcome-select").value;
    const method = document.getElementById("result-method-input").value;

    const seasonRef = db.ref(`seasons/season_${seasonNum}`);
    seasonRef.child('matches').once('value', snapshot => {
        let matches = snapshot.val() || [];
        const mIdx = matches.findIndex(m => m.id === matchId);
        if(mIdx === -1) return;

        const match = matches[mIdx];
        const winnerName = outcome === 'white' ? match.white : (outcome === 'black' ? match.black : 'Draw');

        // Update Match Record
        matches[mIdx].status = 'completed';
        matches[mIdx].winner = winnerName;
        matches[mIdx].method = method;

        // Save back to DB
        seasonRef.child('matches').set(matches);

        // Update Player Overall Stats & GHelo
        updateGHeloAndStats(match.white, match.black, outcome);
        alert("Match result updated successfully!");
    });
}

function updateGHeloAndStats(whiteName, blackName, outcome) {
    const p1 = appState.players[whiteName] || { name: whiteName, ghelo: 800, matches: 0, wins: 0, losses: 0, draws: 0 };
    const p2 = appState.players[blackName] || { name: blackName, ghelo: 800, matches: 0, wins: 0, losses: 0, draws: 0 };

    const K = 50;
    const S1 = outcome === 'white' ? 1 : (outcome === 'draw' ? 0.5 : 0);
    const S2 = outcome === 'black' ? 1 : (outcome === 'draw' ? 0.5 : 0);

    const E1 = 1 / (1 + Math.pow(10, (p2.ghelo - p1.ghelo) / 400));
    const E2 = 1 / (1 + Math.pow(10, (p1.ghelo - p2.ghelo) / 400));

    p1.ghelo = Math.round(p1.ghelo + K * (S1 - E1));
    p2.ghelo = Math.round(p2.ghelo + K * (S2 - E2));

    p1.matches = (p1.matches || 0) + 1;
    p2.matches = (p2.matches || 0) + 1;

    if(S1 === 1) { p1.wins++; p2.losses++; }
    else if(S2 === 1) { p2.wins++; p1.losses++; }
    else { p1.draws++; p2.draws++; }

    db.ref(`players/${whiteName}`).set(p1);
    db.ref(`players/${blackName}`).set(p2);
}

// ADMIN ACTION: ADD SCHEDULED MATCH
function addScheduledMatch() {
    const seasonNum = document.getElementById("schedule-season-select").value;
    const stage = document.getElementById("schedule-stage-select").value;
    const group = document.getElementById("schedule-group-select").value;
    const white = document.getElementById("schedule-white-select").value;
    const black = document.getElementById("schedule-black-select").value;

    const matchesRef = db.ref(`seasons/season_${seasonNum}/matches`);
    matchesRef.once('value', snapshot => {
        let matches = snapshot.val() || [];
        const newMatch = {
            id: matches.length + 1,
            stage,
            group,
            white,
            black,
            status: 'scheduled'
        };
        matches.push(newMatch);
        matchesRef.set(matches);
        alert("New match added to schedule!");
    });
}

function populateMatchDropdown() {
    const seasonNum = document.getElementById("result-season-select").value;
    const matches = (appState.seasons[`season_${seasonNum}`] || {}).matches || [];
    const schedMatches = matches.filter(m => m.status === 'scheduled');

    document.getElementById("result-match-select").innerHTML = schedMatches.map(m => 
        `<option value="${m.id}">Match ${m.id}: ${m.white} vs ${m.black}</option>`
    ).join('');
}

// ADMIN ACTION: GROUP & PLAYER SETUP
function renderGroupSetupForm() {
    const seasonNum = document.getElementById("setup-season-select").value;
    const currentGroups = (appState.seasons[`season_${seasonNum}`] || {}).groups || { A: [], B: [], C: [], D: [] };
    
    let html = '';
    ['A', 'B', 'C', 'D'].forEach(grp => {
        html += `<div class="group-box"><h4>Group ${grp}</h4>`;
        for(let i = 0; i < 5; i++) {
            const pVal = (currentGroups[grp] && currentGroups[grp][i]) ? currentGroups[grp][i] : '';
            html += `
                <div class="form-group">
                    <input type="text" id="group-${grp}-player-${i}" value="${pVal}" placeholder="Player ${i+1} Name">
                </div>
            `;
        }
        html += `</div>`;
    });
    document.getElementById("group-setup-inputs-container").innerHTML = html;
}

function saveGroupSetup() {
    const seasonNum = document.getElementById("setup-season-select").value;
    let groups = { A: [], B: [], C: [], D: [] };

    ['A', 'B', 'C', 'D'].forEach(grp => {
        for(let i = 0; i < 5; i++) {
            const name = document.getElementById(`group-${grp}-player-${i}`).value.trim();
            if(name) {
                groups[grp].push(name);
                // Initialize player in DB if new
                if(!appState.players[name]) {
                    db.ref(`players/${name}`).set({
                        name, ghelo: 800, matches: 0, wins: 0, losses: 0, draws: 0
                    });
                }
            }
        }
    });

    db.ref(`seasons/season_${seasonNum}/groups`).set(groups);
    alert(`Group setup saved for Season ${seasonNum}!`);
}

// MANUAL CORRECTIONS
function loadPlayerCorrectionData() {
    const name = document.getElementById("corr-player-select").value;
    const p = appState.players[name];
    if(p) {
        document.getElementById("corr-name-input").value = p.name;
        document.getElementById("corr-ghelo-input").value = p.ghelo || 800;
        document.getElementById("corr-matches-input").value = p.matches || 0;
        document.getElementById("corr-wins-input").value = p.wins || 0;
        document.getElementById("corr-losses-input").value = p.losses || 0;
        document.getElementById("corr-draws-input").value = p.draws || 0;
    }
}

function savePlayerCorrection() {
    const oldName = document.getElementById("corr-player-select").value;
    const newName = document.getElementById("corr-name-input").value.trim();
    
    const updatedData = {
        name: newName,
        ghelo: parseInt(document.getElementById("corr-ghelo-input").value),
        matches: parseInt(document.getElementById("corr-matches-input").value),
        wins: parseInt(document.getElementById("corr-wins-input").value),
        losses: parseInt(document.getElementById("corr-losses-input").value),
        draws: parseInt(document.getElementById("corr-draws-input").value)
    };

    if(oldName !== newName) {
        db.ref(`players/${oldName}`).remove();
    }
    db.ref(`players/${newName}`).set(updatedData);
    alert("Player record manually corrected!");
}