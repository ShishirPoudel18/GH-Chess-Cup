// js/admin.js

// Admin Login Credentials (Change these values whenever you want!)
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "password123"
};

window.addEventListener("DOMContentLoaded", () => {
    // Check if user has an open admin token session already running
    if (sessionStorage.getItem("GH_ADMIN_AUTH") === "true") {
        showAdminPanel();
    }
});

function attemptLogin() {
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;
    const errorMsg = document.getElementById("login-error");

    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem("GH_ADMIN_AUTH", "true");
        errorMsg.classList.add("hidden");
        showAdminPanel();
    } else {
        errorMsg.classList.remove("hidden");
    }
}

function showAdminPanel() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("admin-interface").classList.remove("hidden");
    switchTab("input");
}

function switchTab(tabName) {
    const tabs = ["input", "delete", "roster"];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.add("hidden");
        document.getElementById(`nav-${t}`).classList.remove("active");
    });

    document.getElementById(`tab-${tabName}`).classList.remove("hidden");
    document.getElementById(`nav-${tabName}`).classList.add("active");

    if (tabName === "delete") renderDeleteTabList();
    if (tabName === "roster") renderRosterTabList();
}

// ==========================================
// STAGE SELECTION CHANGE ROUTINES
// ==========================================
function onStageChange() {
    const stage = document.getElementById("input-stage").value;
    document.getElementById("group-selectors").classList.add("hidden");
    document.getElementById("knockout-selectors").classList.add("hidden");
    document.getElementById("result-inputs").classList.add("hidden");
    document.getElementById("pairing-preview").innerText = "Please select a clean match config setup above...";

    if (stage === "group") {
        document.getElementById("group-selectors").classList.remove("hidden");
        onGroupOrMatchChange();
    } else if (stage === "knockout") {
        document.getElementById("knockout-selectors").classList.remove("hidden");
        onKnockoutRoundChange();
    }
}

function onGroupOrMatchChange() {
    const store = getStore();
    const grp = document.getElementById("input-group").value;
    const matchNo = parseInt(document.getElementById("input-match-no").value);
    
    const match = store.currentMatches.find(m => m.stage === "group" && m.group === grp && m.matchNo === matchNo);
    
    document.getElementById("draw-option").classList.remove("hidden"); // Allow draws in group play
    displayPairingMatch(match);
}

function onKnockoutRoundChange() {
    const store = getStore();
    const koStage = document.getElementById("input-ko-stage").value;
    
    const match = store.currentMatches.find(m => m.stage === koStage);
    
    // Knockouts can't end in a draw
    document.getElementById("draw-option").classList.add("hidden");
    if(document.getElementById("match-outcome").value === "0.5-0.5") {
        document.getElementById("match-outcome").value = "1-0";
    }

    displayPairingMatch(match);
}

function displayPairingMatch(match) {
    const preview = document.getElementById("pairing-preview");
    const resultBox = document.getElementById("result-inputs");

    if (!match) {
        preview.innerText = "Error tracking match pairing target.";
        resultBox.classList.add("hidden");
        return;
    }

    if (!match.white && !match.black) {
        preview.innerHTML = `<span style="color:#ef4444;">Pairing players are undetermined yet (Previous rounds are incomplete).</span>`;
        resultBox.classList.add("hidden");
        return;
    }

    preview.innerHTML = `Target Match Config Matchup:<br><span style="color:#3b82f6;">[White] ${match.white}</span> vs <span style="color:#eab308;">[Black] ${match.black}</span>`;
    
    // Set field values if the match was already logged previously
    if(match.result !== "pending") {
        document.getElementById("match-date").value = match.date || "";
        document.getElementById("match-outcome").value = match.result;
        document.getElementById("match-method").value = match.method || "";
    } else {
        document.getElementById("match-date").value = new Date().toISOString().split('T')[0];
        document.getElementById("match-method").value = "";
    }
    
    resultBox.classList.remove("hidden");
}

function toggleMethodField() {
    const outcome = document.getElementById("match-outcome").value;
    const methodInput = document.getElementById("match-method");
    if(outcome === "0.5-0.5") {
        methodInput.value = "Draw agreement";
    } else {
        methodInput.value = "";
    }
}

// ==========================================
// CORE DATA STATE SAVE WORKER
// ==========================================
function saveMatchRecord() {
    const store = getStore();
    const stage = document.getElementById("input-stage").value;
    const mDate = document.getElementById("match-date").value;
    const mOutcome = document.getElementById("match-outcome").value;
    const mMethod = document.getElementById("match-method").value.trim();

    let match;
    if (stage === "group") {
        const grp = document.getElementById("input-group").value;
        const matchNo = parseInt(document.getElementById("input-match-no").value);
        match = store.currentMatches.find(m => m.stage === "group" && m.group === grp && m.matchNo === matchNo);
    } else {
        const koStage = document.getElementById("input-ko-stage").value;
        match = store.currentMatches.find(m => m.stage === koStage);
    }

    if (!match) return alert("Save structural pointer resolution failure.");

    match.date = mDate;
    match.result = mOutcome;
    match.method = mMethod;

    saveStore(store);
    
    // Automatically recalculate ratings across everything cleanly
    if (typeof processSeasonData === "function") {
        processSeasonData();
    }

    alert("Match saved successfully! Systems recalculations are live.");
    onStageChange(); // Refresh input section view fields smoothly
}

// ==========================================
// TAB REVERSION LOGIC (DELETE TAB)
// ==========================================
function renderDeleteTabList() {
    const store = getStore();
    const container = document.getElementById("completed-matches-list");
    const completed = store.currentMatches.filter(m => m.result !== "pending");

    if (completed.length === 0) {
        container.innerHTML = "<p>No active matches found written into the active logs database.</p>";
        return;
    }

    let html = "";
    completed.forEach((m, idx) => {
        let label = m.stage === "group" ? `Group ${m.group} - Match #${m.matchNo}` : `${m.stage}`;
        html += `<div class="match-item" style="display:flex; justify-content:space-between; align-items:center; border-left-color:#ef4444;">
            <div>
                <strong>${label}:</strong> ${m.white} vs ${m.black} (Result: ${m.result})
            </div>
            <button class="danger-btn" style="width:auto; padding:5px 10px; margin:0;" onclick="deleteMatchByIndex('${m.stage}', '${m.group}', ${m.matchNo})">Delete</button>
        </div>`;
    });
    container.innerHTML = html;
}

function deleteMatchByIndex(stage, group, matchNo) {
    if (!confirm("Are you sure you want to revert this match result? This resets ratings back down to before this match.")) return;

    const store = getStore();
    let match = store.currentMatches.find(m => m.stage === stage && m.group === group && m.matchNo === matchNo);
    
    if (match) {
        match.result = "pending";
        match.date = "";
        match.method = "";
        
        // Wipe trailing cascades down structural paths clear safely
        if(stage.startsWith("QF") || stage === "group") {
            store.currentMatches.forEach(m => {
                if(m.stage !== "group") {
                    m.white = ""; m.black = ""; m.result = "pending"; m.date = ""; m.method = "";
                }
            });
        }

        saveStore(store);
        processSeasonData();
        renderDeleteTabList();
        alert("Match registration successfully reverted.");
    }
}

// ==========================================
// PLAYER ROSTER MANAGEMENT UTILITY
// ==========================================
function renderRosterTabList() {
    const store = getStore();
    const container = document.getElementById("roster-management-container");
    const players = Object.values(store.players);

    let html = `<table><tr><th>Current Name Field</th><th>Update Field Input</th></tr>`;
    players.forEach(p => {
        html += `<tr>
            <td><strong>${p.name}</strong> (Group ${p.currentGroup || 'None'})</td>
            <td><input type="text" id="rename-${p.name}" placeholder="Type new name to swap" style="margin:0; padding:6px;"></td>
            <td><button onclick="renamePlayer('${p.name}')" style="padding:6px; margin:0;">Update</button></td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

function renamePlayer(oldName) {
    const newName = document.getElementById(`rename-${oldName}`).value.trim();
    if (!newName) return alert("Please specify a real update value target name string.");

    const store = getStore();
    if(store.players[newName]) return alert("A player with that specific name record string already exists inside database structures.");

    // Swap data map reference key structures completely
    store.players[newName] = store.players[oldName];
    store.players[newName].name = newName;
    delete store.players[oldName];

    // Cascade structural string matching targets updates seamlessly down live logs 
    store.currentMatches.forEach(m => {
        if(m.white === oldName) m.white = newName;
        if(m.black === oldName) m.black = newName;
    });

    saveStore(store);
    processSeasonData();
    renderRosterTabList();
    alert(`Successfully changed identity keys from "${oldName}" over to "${newName}".`);
}