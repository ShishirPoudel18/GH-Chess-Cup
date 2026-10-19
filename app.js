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
    
    // Highlight the clicked season button
    document.querySelectorAll(".season-select-btn").forEach(btn => {
        const isSelected = btn.getAttribute("onclick").includes(`'${seasonNum}'`) || btn.getAttribute("onclick").includes(`(${seasonNum})`);
        btn.classList.toggle("active-season-btn", isSelected);
    });

    renderArchiveSeason(seasonNum);
}

function renderArchiveSeason(seasonNum) {
    const container = document.getElementById("archive-season-content");
    const seasonKey = seasonNum === 'test' ? 'season_test' : `season_${seasonNum}`;
    const seasonData = appState.seasons[seasonKey];

    if (!seasonData) {
        container.innerHTML = `<div class="card"><p class="empty-state">No data to display for Season ${seasonNum}.</p></div>`;
        return;
    }

    const matches = seasonData.matches || [];
    const finalMatch = matches.find(m => m.stage === 'Final' && m.status === 'completed');

    let championBannerHtml = '';
    if (finalMatch && finalMatch.winner) {
        const winner = finalMatch.winner;
        const runnerUp = winner === finalMatch.white ? finalMatch.black : finalMatch.white;

        championBannerHtml = `
            <div class="season-champion-banner">
                <div class="champion-box">
                    <h4><i class="fa-solid fa-trophy"></i> Champion</h4>
                    <h3>${winner}</h3>
                </div>
                <div class="runnerup-box">
                    <h4><i class="fa-solid fa-medal"></i> Runner-Up</h4>
                    <h3>${runnerUp}</h3>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        ${championBannerHtml}
        <div class="card">
            <h3><i class="fa-solid fa-list-check"></i> ${seasonNum === 'test' ? 'Test Season' : `Season ${seasonNum}`} Matches</h3>
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
// Sort Group Standings (Points -> GHPS -> Head-to-Head)
function sortGroupStandings(playersStats, groupMatches) {
    return playersStats.sort((a, b) => {
        // 1. Group Points
        if (b.pts !== a.pts) return b.pts - a.pts;

        // 2. GHPS Score
        if (Math.abs(b.ghps - a.ghps) > 0.0001) return b.ghps - a.ghps;

        // 3. Head-to-Head Result
        const h2h = groupMatches.find(m =>
            m.status === 'completed' &&
            ((m.white === a.name && m.black === b.name) || (m.white === b.name && m.black === a.name))
        );
        if (h2h) {
            if (h2h.winner === a.name) return -1;
            if (h2h.winner === b.name) return 1;
        }

        return 0;
    });
}

// Calculate Mathematical Qualification Status ('Q', 'E', or '')
function getPlayerQualificationStatus(player, groupStats, isGroupFinished = false) {
    const TOTAL_MATCHES_PER_PLAYER = 4;
    
    // Sort players strictly by current standings (Points -> GHPS -> H2H)
    const currentRankIndex = groupStats.findIndex(p => p.name === player.name);

    // IF GROUP IS 100% FINISHED: Top 2 are Qualified, rest are Eliminated
    if (isGroupFinished) {
        return currentRankIndex < 2 ? 'Q' : 'E';
    }

    // IN-PROGRESS CALCULATIONS:
    const matchesRemaining = TOTAL_MATCHES_PER_PLAYER - player.p;
    const maxPossiblePoints = player.pts + matchesRemaining;

    // Get max possible points for all OTHER players in the group
    const otherMaxPoints = groupStats
        .filter(p => p.name !== player.name)
        .map(p => p.pts + (TOTAL_MATCHES_PER_PLAYER - p.p))
        .sort((a, b) => b - a);

    // Thresholds:
    // 3rd highest potential among opponents
    const thirdPlacePotential = otherMaxPoints[2] !== undefined ? otherMaxPoints[2] : 0;

    // 2nd highest current points among opponents
    const secondPlaceCurrentPts = [...groupStats]
        .filter(p => p.name !== player.name)
        .map(p => p.pts)
        .sort((a, b) => b - a)[1] || 0;

    // 1. GUARANTEED QUALIFIED: Even if every other player gains max remaining points,
    // this player's current points strictly guarantee a Top 2 finish.
    if (player.pts > thirdPlacePotential) {
        return 'Q';
    }

    // 2. GUARANTEED ELIMINATED: Max possible points cannot catch up to the current 2nd place score
    if (maxPossiblePoints < secondPlaceCurrentPts) {
        return 'E';
    }

    return '';
}
// Render Generic Season Details with Dynamic Points & Knockout Bracket
function renderSeasonDetails(seasonNum, schedId, tableId, bracketId) {
    const seasonData = appState.seasons[`season_${seasonNum}`] || {};
    const matches = seasonData.matches || [];
    const groups = seasonData.groups || { A: [], B: [], C: [], D: [] };

    // Matches Render
    const schedContainer = document.getElementById(schedId);
    if (schedContainer) {
        if (matches.length === 0) {
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

    // Dynamic Standings and Seed Resolution
    const resolvedSeeds = {};

    // Points Table Render with Badges
    const tableContainer = document.getElementById(tableId);
    if (tableContainer) {
        let groupsHtml = '';
        ['A', 'B', 'C', 'D'].forEach(grp => {
            const playerList = groups[grp] || [];
            const grpMatches = matches.filter(m => m.group === grp || (playerList.includes(m.white) && playerList.includes(m.black)));
            let stats = playerList.map(name => calculateSeasonPlayerStats(name, grpMatches));

            // Sort using Points -> GHPS -> H2H
            stats = sortGroupStandings(stats, grpMatches);

            // Determine Seeds for Bracket
            const totalGroupMatchesCompleted = grpMatches.filter(m => m.status === 'completed').length;
            const groupFinished = totalGroupMatchesCompleted === 10; // 5 players * 4 matches / 2 = 10 total matches

            const p1Status = stats[0] ? getPlayerQualificationStatus(stats[0], stats) : '';
            const p2Status = stats[1] ? getPlayerQualificationStatus(stats[1], stats) : '';

            resolvedSeeds[`${grp}1`] = (groupFinished || p1Status === 'Q') && stats[0] ? stats[0].name : `${grp}1`;
            resolvedSeeds[`${grp}2`] = (groupFinished || (p1Status === 'Q' && p2Status === 'Q')) && stats[1] ? stats[1].name : `${grp}2`;

            groupsHtml += `
                <div class="group-box">
                    <h4>Group ${grp}</h4>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Player</th><th>P</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th>GHPS</th></tr>
                            </thead>
                            <tbody>
                                ${stats.map(s => {
                                    const status = getPlayerQualificationStatus(s, stats, groupFinished);
                                    const badge = status === 'Q' 
                                        ? '<span class="badge badge-q" title="Qualified">(Q)</span>' 
                                        : (status === 'E' ? '<span class="badge badge-e" title="Eliminated">(E)</span>' : '');

                                    return `
                                        <tr>
                                            <td><strong>${s.name}</strong>${badge}</td>
                                            <td>${s.p}</td><td>${s.w}</td><td>${s.l}</td><td>${s.d}</td>
                                            <td><strong>${s.pts}</strong></td>
                                            <td>${s.ghps.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        tableContainer.innerHTML = groupsHtml;
    }

    // Knockout Bracket Render with Dynamic Player Resolution (QF, SF, Final)
    const bracketContainer = document.getElementById(bracketId);
    if (bracketContainer) {
        // Find scheduled/completed KO matches from match data
        const qfMatches = matches.filter(m => m.stage === 'Quarter Final');
        const sfMatches = matches.filter(m => m.stage === 'Semi Final');
        const finalMatch = matches.find(m => m.stage === 'Final');

        // Quarter Final Player Resolution
        const getQFSlot = (index, fallback1, fallback2) => {
            const m = qfMatches[index];
            if (m) {
                return `<span class="bracket-confirmed">${m.white}</span> vs <span class="bracket-confirmed">${m.black}</span>`;
            }
            const p1 = resolvedSeeds[fallback1] || fallback1;
            const p2 = resolvedSeeds[fallback2] || fallback2;
            const isP1 = p1.length > 2 ? 'bracket-confirmed' : '';
            const isP2 = p2.length > 2 ? 'bracket-confirmed' : '';
            return `<span class="${isP1}">${p1}</span> vs <span class="${isP2}">${p2}</span>`;
        };

        // Semi Final Player Resolution
        const getSFSlot = (index, fallbackText) => {
            const m = sfMatches[index];
            if (m) {
                return `<span class="bracket-confirmed">${m.white}</span> vs <span class="bracket-confirmed">${m.black}</span>`;
            }
            // Check if Quarter Finals were completed to infer SF participants
            const qf1 = qfMatches[0];
            const qf2 = qfMatches[1];
            const qf3 = qfMatches[2];
            const qf4 = qfMatches[3];

            if (index === 0 && qf1?.winner && qf3?.winner) {
                return `<span class="bracket-confirmed">${qf1.winner}</span> vs <span class="bracket-confirmed">${qf3.winner}</span>`;
            }
            if (index === 1 && qf2?.winner && qf4?.winner) {
                return `<span class="bracket-confirmed">${qf2.winner}</span> vs <span class="bracket-confirmed">${qf4.winner}</span>`;
            }
            return fallbackText;
        };

        // Final Player Resolution
        const getFinalSlot = () => {
            if (finalMatch) {
                return `<span class="bracket-confirmed">${finalMatch.white}</span> vs <span class="bracket-confirmed">${finalMatch.black}</span>`;
            }
            const sf1 = sfMatches[0];
            const sf2 = sfMatches[1];

            if (sf1?.winner && sf2?.winner) {
                return `<span class="bracket-confirmed">${sf1.winner}</span> vs <span class="bracket-confirmed">${sf2.winner}</span>`;
            }
            return 'Winner SF1 vs Winner SF2';
        };

        bracketContainer.innerHTML = `
            <div class="bracket-round">
                <h4>Quarter Finals</h4>
                <div class="match-card"><strong>QF1:</strong> ${getQFSlot(0, 'A1', 'B2')}</div>
                <div class="match-card"><strong>QF2:</strong> ${getQFSlot(1, 'B1', 'A2')}</div>
                <div class="match-card"><strong>QF3:</strong> ${getQFSlot(2, 'C1', 'D2')}</div>
                <div class="match-card"><strong>QF4:</strong> ${getQFSlot(3, 'D1', 'C2')}</div>
            </div>
            <div class="bracket-round">
                <h4>Semi Finals</h4>
                <div class="match-card"><strong>SF1:</strong> ${getSFSlot(0, 'Winner QF1 vs Winner QF3')}</div>
                <div class="match-card"><strong>SF2:</strong> ${getSFSlot(1, 'Winner QF2 vs Winner QF4')}</div>
            </div>
            <div class="bracket-round">
                <h4>Final</h4>
                <div class="match-card"><strong>Final:</strong> ${getFinalSlot()}</div>
            </div>
        `;
    }
}

// Calculate Season Stats & GHPS
// Calculate Season Stats & Rating-Adjusted GHPS
// Calculate Season Stats & Rating-Adjusted GHPS (STRICTLY GROUP STAGE ONLY)
function calculateSeasonPlayerStats(playerName, matches) {
    let p=0, w=0, l=0, d=0, pts=0, ghps=0;
    
    // Get current player's GHelo (defaults to 800 if missing)
    const playerRating = (appState.players[playerName] || {}).ghelo || 800;

    // Filter STRICTLY for completed GROUP STAGE matches
    matches.filter(m => 
        m.status === 'completed' && 
        m.stage === 'Group Stage' && 
        (m.white === playerName || m.black === playerName)
    ).forEach(m => {
        p++;
        const isWhite = m.white === playerName;
        const opponentName = isWhite ? m.black : m.white;
        const opponentRating = (appState.players[opponentName] || {}).ghelo || 800;

        const actualScore = m.winner === playerName ? 1 : (m.winner === 'Draw' ? 0.5 : 0);
        
        if (actualScore === 1) w++;
        else if (actualScore === 0) l++;
        else d++;

        pts += actualScore;
        
        // Dynamic Expected Score (E) based on opponent's GHelo rating
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        
        // Rating-adjusted GHPS: Sum of (S - E)
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
// Firebase Auth State Observer (Listens for login/logout automatically)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        appState.isAdminLoggedIn = true;
        document.getElementById("admin-login-card").classList.add("hidden");
        document.getElementById("admin-panel").classList.remove("hidden");
        populateAdminSeasonDropdowns();
    } else {
        appState.isAdminLoggedIn = false;
        document.getElementById("admin-login-card").classList.remove("hidden");
        document.getElementById("admin-panel").classList.add("hidden");
    }
});

// Secure Firebase Login
function loginAdmin() {
    const email = document.getElementById("admin-email-input").value.trim();
    const pass = document.getElementById("admin-pass-input").value;
    const errorMsg = document.getElementById("login-error");

    errorMsg.innerText = "";

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
            console.log("Logged in successfully as admin.");
        })
        .catch((error) => {
            errorMsg.innerText = "Login failed: " + error.message;
        });
}

// Secure Firebase Logout
function logoutAdmin() {
    firebase.auth().signOut().then(() => {
        alert("Logged out of Admin Panel.");
    });
}
function switchAdminSubTab(tabName) {
    document.querySelectorAll(".admin-sub-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".admin-tab-btn").forEach(el => el.classList.remove("active"));
    document.getElementById(`admin-sub-${tabName}`).classList.add("active");
}

function populateAdminSeasonDropdowns() {
    let options = [1,2,3,4,5,6,7,8].map(s => `<option value="${s}">Season ${s}</option>`).join('');
    options += `<option value="test" style="color: var(--accent); font-weight: bold;">🧪 Test Season (Sandbox)</option>`;
    
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
    const outcome = document.getElementById("result-outcome-select").value; // 'p1', 'p2', or 'draw'
    const method = document.getElementById("result-method-input").value;

    const seasonRef = db.ref(`seasons/season_${seasonNum}`);
    seasonRef.child('matches').once('value', snapshot => {
        let matches = snapshot.val() || [];
        const mIdx = matches.findIndex(m => m.id === matchId);
        if (mIdx === -1) return;

        const match = matches[mIdx];
        const player1 = match.white; // stored player 1
        const player2 = match.black; // stored player 2

        const winnerName = outcome === 'p1' ? player1 : (outcome === 'p2' ? player2 : 'Draw');

        // Update Match Record
        matches[mIdx].status = 'completed';
        matches[mIdx].winner = winnerName;
        matches[mIdx].method = method;

        // Save back to DB
        seasonRef.child('matches').set(matches);

        // Update Player Overall Stats & GHelo
        // Only update real GHelo and career stats if it's NOT a test season
if (seasonNum !== 'test') {
        updateGHeloAndStats(player1, player2, outcome);
        alert("Match result updated successfully!");
    }});
}

function updateGHeloAndStats(p1Name, p2Name, outcome) {
    const p1 = appState.players[p1Name] || { name: p1Name, ghelo: 800, matches: 0, wins: 0, losses: 0, draws: 0 };
    const p2 = appState.players[p2Name] || { name: p2Name, ghelo: 800, matches: 0, wins: 0, losses: 0, draws: 0 };

    const K = 50;
    const S1 = outcome === 'p1' ? 1 : (outcome === 'draw' ? 0.5 : 0);
    const S2 = outcome === 'p2' ? 1 : (outcome === 'draw' ? 0.5 : 0);

    const E1 = 1 / (1 + Math.pow(10, (p2.ghelo - p1.ghelo) / 400));
    const E2 = 1 / (1 + Math.pow(10, (p1.ghelo - p2.ghelo) / 400));

    p1.ghelo = Math.round(p1.ghelo + K * (S1 - E1));
    p2.ghelo = Math.round(p2.ghelo + K * (S2 - E2));

    p1.matches = (p1.matches || 0) + 1;
    p2.matches = (p2.matches || 0) + 1;

    if (S1 === 1) { p1.wins++; p2.losses++; }
    else if (S2 === 1) { p2.wins++; p1.losses++; }
    else { p1.draws++; p2.draws++; }

    db.ref(`players/${p1Name}`).set(p1);
    db.ref(`players/${p2Name}`).set(p2);
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
// HEAD TO HEAD COMPARISON RENDERING
function renderH2H() {
    const p1Name = document.getElementById("h2h-player-1").value;
    const p2Name = document.getElementById("h2h-player-2").value;
    const container = document.getElementById("h2h-result-container");

    if (!p1Name || !p2Name || p1Name === p2Name) {
        container.innerHTML = `<p class="empty-state">Select two different players to compare head-to-head stats.</p>`;
        return;
    }

    const p1 = appState.players[p1Name] || { ghelo: 800 };
    const p2 = appState.players[p2Name] || { ghelo: 800 };

    let p1Wins = 0, p2Wins = 0, draws = 0, totalMatches = 0;

    // Iterate through all matches across all seasons to calculate H2H history
   Object.keys(appState.seasons).forEach(seasonKey => {
    if (seasonKey === 'season_test') return; // Skip test season data in H2H
    const season = appState.seasons[seasonKey];
        (season.matches || []).forEach(m => {
            if (m.status === 'completed' && 
               ((m.white === p1Name && m.black === p2Name) || (m.white === p2Name && m.black === p1Name))) {
                totalMatches++;
                if (m.winner === p1Name) p1Wins++;
                else if (m.winner === p2Name) p2Wins++;
                else draws++;
            }
        });
    });

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; text-align: center;">
            <div style="flex: 1;">
                <h3 style="color: var(--primary);">${p1Name}</h3>
                <p>GHelo: <strong>${p1.ghelo || 800}</strong></p>
                <h2 style="font-size: 2rem; margin-top: 0.5rem; color: var(--success);">${p1Wins}</h2>
                <p>Wins</p>
            </div>
            <div style="padding: 0 1rem;">
                <p style="font-weight: bold; font-size: 1.2rem; color: var(--text-muted);">VS</p>
                <p style="font-size: 0.85rem;">Matches: ${totalMatches}</p>
                <p style="font-size: 0.85rem;">Draws: ${draws}</p>
            </div>
            <div style="flex: 1;">
                <h3 style="color: var(--primary);">${p2Name}</h3>
                <p>GHelo: <strong>${p2.ghelo || 800}</strong></p>
                <h2 style="font-size: 2rem; margin-top: 0.5rem; color: var(--success);">${p2Wins}</h2>
                <p>Wins</p>
            </div>
        </div>
    `;
}

// 1. AUTO-SCHEDULE ALL 40 GROUP STAGE MATCHES (Interleaved across Groups A, B, C, D)
function autoScheduleGroupStage() {
    const seasonNum = document.getElementById("schedule-season-select").value;
    const seasonData = appState.seasons[`season_${seasonNum}`] || {};
    const groups = seasonData.groups || {};

    // Validate that all 4 groups have 5 players
    const groupKeys = ['A', 'B', 'C', 'D'];
    for (const g of groupKeys) {
        if (!groups[g] || groups[g].length < 5) {
            alert(`Group ${g} does not have 5 players assigned yet. Please complete Group Setup first!`);
            return;
        }
    }

    if (!confirm(`Generate round-robin schedule for Season ${seasonNum}? This will append all 40 group matches.`)) return;

    // Standard 10-match sequence for 5 players (0-indexed indices: 0=P1, 1=P2, 2=P3, 3=P4, 4=P5)
    const roundPairs = [
        [0, 1], // Match 1: P1 vs P2
        [2, 3], // Match 2: P3 vs P4
        [0, 4], // Match 3: P1 vs P5
        [1, 2], // Match 4: P2 vs P3
        [3, 4], // Match 5: P4 vs P5
        [0, 2], // Match 6: P1 vs P3
        [1, 3], // Match 7: P2 vs P4
        [2, 4], // Match 8: P3 vs P5
        [0, 3], // Match 9: P1 vs P4
        [1, 4]  // Match 10: P2 vs P5
    ];

    const matchesRef = db.ref(`seasons/season_${seasonNum}/matches`);
    matchesRef.once('value', snapshot => {
        let existingMatches = snapshot.val() || [];
        let nextId = existingMatches.length + 1;
        let newMatches = [];

        // Interleave across groups: Round 1 (A, B, C, D), Round 2 (A, B, C, D), ...
        for (let round = 0; round < 10; round++) {
            const pair = roundPairs[round];
            for (const grp of groupKeys) {
                const player1 = groups[grp][pair[0]];
                const player2 = groups[grp][pair[1]];

                newMatches.push({
                    id: nextId++,
                    stage: "Group Stage",
                    group: grp,
                    white: player1,
                    black: player2,
                    status: "scheduled"
                });
            }
        }

        const allMatches = existingMatches.concat(newMatches);
        matchesRef.set(allMatches);
        alert(`Successfully generated all 40 group stage matches for Season ${seasonNum}!`);
    });
}

// 2. AUTO-SCHEDULE KNOCKOUT MATCHES (Quarter Finals, Semi Finals, Final)
function autoScheduleKnockouts() {
    const seasonNum = document.getElementById("schedule-season-select").value;
    const seasonData = appState.seasons[`season_${seasonNum}`] || {};
    const matches = seasonData.matches || [];
    const groups = seasonData.groups || {};

    // Determine current knockout progress
    const qfMatches = matches.filter(m => m.stage === 'Quarter Final');
    const sfMatches = matches.filter(m => m.stage === 'Semi Final');
    const finalMatches = matches.filter(m => m.stage === 'Final');

    const matchesRef = db.ref(`seasons/season_${seasonNum}/matches`);

    // Scenario A: Generate Quarter Finals
    if (qfMatches.length < 4) {
        // Resolve Group Winners & Runners-up
        const seeds = {};
        ['A', 'B', 'C', 'D'].forEach(grp => {
            const playerList = groups[grp] || [];
            const grpMatches = matches.filter(m => m.group === grp || (playerList.includes(m.white) && playerList.includes(m.black)));
            let stats = playerList.map(name => calculateSeasonPlayerStats(name, grpMatches));
            stats = sortGroupStandings(stats, grpMatches);

            if (stats[0]) seeds[`${grp}1`] = stats[0].name;
            if (stats[1]) seeds[`${grp}2`] = stats[1].name;
        });

        const qfPairings = [
            { idName: 'QF1', p1: seeds['A1'], p2: seeds['B2'] },
            { idName: 'QF2', p1: seeds['B1'], p2: seeds['A2'] },
            { idName: 'QF3', p1: seeds['C1'], p2: seeds['D2'] },
            { idName: 'QF4', p1: seeds['D1'], p2: seeds['C2'] }
        ];

        let nextId = matches.length + 1;
        let newQF = [];

        qfPairings.forEach(qf => {
            if (qf.p1 && qf.p2) {
                newQF.push({
                    id: nextId++,
                    stage: "Quarter Final",
                    group: "KO",
                    white: qf.p1,
                    black: qf.p2,
                    status: "scheduled"
                });
            }
        });

        if (newQF.length === 0) {
            alert("Group standings are not finalized enough to schedule Quarter Finals.");
            return;
        }

        matchesRef.set(matches.concat(newQF));
        alert(`Scheduled ${newQF.length} Quarter Final match(es)!`);
        return;
    }

    // Scenario B: Generate Semi Finals (Requires QF 1-4 completed)
    if (sfMatches.length < 2) {
        const qfCompleted = qfMatches.filter(m => m.status === 'completed');
        if (qfCompleted.length < 4) {
            alert("All 4 Quarter Final matches must be completed before scheduling Semi Finals.");
            return;
        }

        // Matchup order: QF1 winner vs QF3 winner, QF2 winner vs QF4 winner
        const wQF1 = qfMatches[0].winner;
        const wQF2 = qfMatches[1].winner;
        const wQF3 = qfMatches[2].winner;
        const wQF4 = qfMatches[3].winner;

        let nextId = matches.length + 1;
        const newSF = [
            { id: nextId++, stage: "Semi Final", group: "KO", white: wQF1, black: wQF3, status: "scheduled" },
            { id: nextId++, stage: "Semi Final", group: "KO", white: wQF2, black: wQF4, status: "scheduled" }
        ];

        matchesRef.set(matches.concat(newSF));
        alert("Semi Final matches scheduled!");
        return;
    }

    // Scenario C: Generate Final (Requires both Semi Finals completed)
    if (finalMatches.length < 1) {
        const sfCompleted = sfMatches.filter(m => m.status === 'completed');
        if (sfCompleted.length < 2) {
            alert("Both Semi Final matches must be completed before scheduling the Final.");
            return;
        }

        const wSF1 = sfMatches[0].winner;
        const wSF2 = sfMatches[1].winner;

        let nextId = matches.length + 1;
        const newFinal = [
            { id: nextId++, stage: "Final", group: "KO", white: wSF1, black: wSF2, status: "scheduled" }
        ];

        matchesRef.set(matches.concat(newFinal));
        alert("Grand Final scheduled!");
        return;
    }

    alert("All knockout matches for this season are already scheduled!");
}

// Reset Test Season Sandbox
function resetTestSeason() {
    if (confirm("Are you sure you want to reset all Test Season data? This will clear all test matches and group setups.")) {
        db.ref('seasons/season_test').remove().then(() => {
            alert("Test Season sandbox reset successfully!");
        });
    }
}
