// js/engine.js

function initDatabase() {
    if (!localStorage.getItem("GH_STORE")) {
        const store = {
            currentSeasonId: 3,
            players: {},
            seasonRecords: historicalSeasons, // seeded from data/db.js
            currentMatches: [], // Holds array of completed or pending matches
            photos: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] }
        };

        // Populate initial player data profiles
        initialPlayers.forEach(p => {
            store.players[p.name] = {
                name: p.name,
                ghelo: p.baseGHelo,
                topGHelo: p.baseGHelo,
                allTimePlayed: p.s12Played,
                allTimeWon: p.s12Wins,
                allTimeLost: p.s12Losses,
                allTimeDrawn: p.s12Draws,
                // Season scoped variables
                currentGroup: "",
                currentWins: 0,
                currentLosses: 0,
                currentDraws: 0,
                currentPoints: 0,
                currentGHPS: 0
            };
        });

        localStorage.setItem("GH_STORE", JSON.stringify(store));
        seedCurrentSeasonGroups();
    }
}

function getStore() {
    return JSON.parse(localStorage.getItem("GH_STORE"));
}

function saveStore(store) {
    localStorage.setItem("GH_STORE", JSON.stringify(store));
}

// Automatically seeds 4 groups of 5 based on Win % then GHelo
function seedCurrentSeasonGroups() {
    const store = getStore();
    const pList = Object.values(store.players);

    pList.sort((a, b) => {
        const winPctA = a.allTimePlayed > 0 ? (a.allTimeWon / a.allTimePlayed) : 0;
        const winPctB = b.allTimePlayed > 0 ? (b.allTimeWon / b.allTimePlayed) : 0;
        if (winPctB !== winPctA) return winPctB - winPctA;
        return b.ghelo - a.ghelo;
    });

    const groups = ["A", "B", "C", "D"];
    const groupMembers = { A: [], B: [], C: [], D: [] };

    pList.forEach((p, idx) => {
        const groupIdx = Math.floor(idx / 5);
        if(groupIdx < 4) {
            const grp = groups[groupIdx];
            store.players[p.name].currentGroup = grp;
            store.players[p.name].currentWins = 0;
            store.players[p.name].currentLosses = 0;
            store.players[p.name].currentDraws = 0;
            store.players[p.name].currentPoints = 0;
            store.players[p.name].currentGHPS = 0;
            groupMembers[grp].push(p.name);
        }
    });

    // Generate fixed schedule for this season
    store.currentMatches = [];
    groups.forEach(grp => {
        const members = groupMembers[grp];
        fixedScheduleMatrix.forEach(m => {
            store.currentMatches.push({
                seasonId: store.currentSeasonId,
                stage: "group",
                group: grp,
                matchNo: m.matchNo,
                white: members[m.p1Idx],
                black: members[m.p2Idx],
                result: "pending", // "1-0", "0-1", "0.5-0.5"
                date: "",
                method: ""
            });
        });
    });

    // Seed empty knockout nodes
    const koNodes = [
        { stage: "QF1", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "QF2", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "QF3", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "QF4", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "SF1", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "SF2", white: "", black: "", result: "pending", date: "", method: "" },
        { stage: "Final", white: "", black: "", result: "pending", date: "", method: "" }
    ];
    store.currentMatches.push(...koNodes);

    saveStore(store);
}

// Recalculate everything sequentially to ensure accuracy
function processSeasonData() {
    const store = getStore();
    
    // Reset tournament metrics before reprocessing live calculations
    Object.keys(store.players).forEach(name => {
        const p = store.players[name];
        p.currentWins = 0;
        p.currentLosses = 0;
        p.currentDraws = 0;
        p.currentPoints = 0;
        p.currentGHPS = 0;
    });

    // Step-by-step resolution of completed matches
    store.currentMatches.forEach(m => {
        if (m.result === "pending") return;

        let w = store.players[m.white];
        let b = store.players[m.black];
        if (!w || !b) return;

        let expectedW = 1 / (1 + Math.pow(10, (b.ghelo - w.ghelo) / 400));
        let expectedB = 1 / (1 + Math.pow(10, (w.ghelo - b.ghelo) / 400));

        let sW = 0, sB = 0;
        if (m.result === "1-0") { sW = 1; sB = 0; if(m.stage==="group"){w.currentWins++; b.currentLosses++;} }
        else if (m.result === "0-1") { sW = 0; sB = 1; if(m.stage==="group"){b.currentWins++; w.currentLosses++;} }
        else { sW = 0.5; sB = 0.5; if(m.stage==="group"){w.currentDraws++; b.currentDraws++;} }

        if (m.stage === "group") {
            w.currentPoints = w.currentWins * 1 + w.currentDraws * 0.5;
            b.currentPoints = b.currentWins * 1 + b.currentDraws * 0.5;
            w.currentGHPS += (sW - expectedW);
            b.currentGHPS += (sB - expectedB);
        }

        w.ghelo += 40 * (sW - expectedW);
        b.ghelo += 40 * (sB - expectedB);

        if (w.ghelo > w.topGHelo) w.topGHelo = w.ghelo;
        if (b.ghelo > b.topGHelo) b.topGHelo = b.ghelo;
    });

    // Compute Group Tables and determine knockout eligibility
    const standings = computeGroupStandings(store);
    
    // Check if group stage is done to automatically map Quarter Finals
    const groupStageComplete = store.currentMatches.filter(m => m.stage === "group" && m.result === "pending").length === 0;
    if (groupStageComplete) {
        // QF1: A1 vs B2
        store.currentMatches.find(m => m.stage === "QF1").white = standings.A[0].name;
        store.currentMatches.find(m => m.stage === "QF1").black = standings.B[1].name;
        // QF2: B1 vs A2
        store.currentMatches.find(m => m.stage === "QF2").white = standings.B[0].name;
        store.currentMatches.find(m => m.stage === "QF2").black = standings.A[1].name;
        // QF3: C1 vs D2
        store.currentMatches.find(m => m.stage === "QF3").white = standings.C[0].name;
        store.currentMatches.find(m => m.stage === "QF3").black = standings.D[1].name;
        // QF4: D1 vs C2
        store.currentMatches.find(m => m.stage === "QF4").white = standings.D[0].name;
        store.currentMatches.find(m => m.stage === "QF4").black = standings.C[1].name;
    }

    // Resolve structural SF/Final assignments based on completed QF nodes
    resolveKnockoutProgression(store);
    saveStore(store);
}

function computeGroupStandings(store) {
    const groups = { A: [], B: [], C: [], D: [] };
    Object.values(store.players).forEach(p => {
        if (groups[p.currentGroup]) groups[p.currentGroup].push(p);
    });

    Object.keys(groups).forEach(g => {
        groups[g].sort((a, b) => {
            if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
            return b.currentGHPS - a.currentGHPS;
        });
    });
    return groups;
}

function resolveKnockoutProgression(store) {
    const qf1 = store.currentMatches.find(m => m.stage === "QF1");
    const qf2 = store.currentMatches.find(m => m.stage === "QF2");
    const qf3 = store.currentMatches.find(m => m.stage === "QF3");
    const qf4 = store.currentMatches.find(m => m.stage === "QF4");
    const sf1 = store.currentMatches.find(m => m.stage === "SF1");
    const sf2 = store.currentMatches.find(m => m.stage === "SF2");
    const final = store.currentMatches.find(m => m.stage === "Final");

    if (qf1.result !== "pending" && qf2.result !== "pending") {
        sf1.white = qf1.result === "1-0" ? qf1.white : qf1.black;
        sf1.black = qf2.result === "1-0" ? qf2.white : qf2.black;
    }
    if (qf3.result !== "pending" && qf4.result !== "pending") {
        sf2.white = qf3.result === "1-0" ? qf3.white : qf3.black;
        sf2.black = qf4.result === "1-0" ? qf4.white : qf4.black;
    }
    if (sf1.result !== "pending" && sf2.result !== "pending") {
        final.white = sf1.result === "1-0" ? sf1.white : sf1.black;
        final.black = sf2.result === "1-0" ? sf2.white : sf2.black;
    }
}

// Initialize database execution mapping
initDatabase();