// data/db.js

// 1. THE OFFICIAL 20 PARTICIPANTS WITH EXACT UNIFIED LEGACY STATS FROM S1+S2
const initialPlayers = [
    { name: "Utsav Sapkota", baseGHelo: 920, totalPlayed: 6, totalWins: 6, totalLosses: 0, totalDraws: 0, group: "A" },
    { name: "Shishir Poudel", baseGHelo: 1000, totalPlayed: 12, totalWins: 11, totalLosses: 1, totalDraws: 0, group: "A" },
    { name: "Sushanta Karki", baseGHelo: 900, totalPlayed: 11, totalWins: 8, totalLosses: 3, totalDraws: 0, group: "A" },
    { name: "Sujan Thapa", baseGHelo: 900, totalPlayed: 11, totalWins: 8, totalLosses: 3, totalDraws: 0, group: "A" },
    { name: "Yusush Magar", baseGHelo: 860, totalPlayed: 9, totalWins: 6, totalLosses: 3, totalDraws: 0, group: "A" },
    
    { name: "Sujal Poudel", baseGHelo: 820, totalPlayed: 9, totalWins: 5, totalLosses: 4, totalDraws: 0, group: "B" },
    { name: "Yogesh Ale Magar", baseGHelo: 800, totalPlayed: 10, totalWins: 5, totalLosses: 5, totalDraws: 0, group: "B" },
    { name: "Saurav Sharma", baseGHelo: 780, totalPlayed: 9, totalWins: 4, totalLosses: 5, totalDraws: 0, group: "B" },
    { name: "Sushant Raj Shrestha", baseGHelo: 780, totalPlayed: 9, totalWins: 4, totalLosses: 5, totalDraws: 0, group: "B" },
    { name: "Suyog Sedhai", baseGHelo: 780, totalPlayed: 7, totalWins: 3, totalLosses: 4, totalDraws: 0, group: "B" },

    { name: "Thomas Uprety", baseGHelo: 780, totalPlayed: 5, totalWins: 2, totalLosses: 3, totalDraws: 0, group: "C" },
    { name: "Shivam Patel", baseGHelo: 780, totalPlayed: 3, totalWins: 1, totalLosses: 2, totalDraws: 0, group: "C" },
    { name: "Shushant Poudel", baseGHelo: 780, totalPlayed: 3, totalWins: 1, totalLosses: 2, totalDraws: 0, group: "C" },
    { name: "Yogesh Poudel", baseGHelo: 780, totalPlayed: 3, totalWins: 1, totalLosses: 2, totalDraws: 0, group: "C" },
    { name: "Sushanta Ghimire", baseGHelo: 760, totalPlayed: 4, totalWins: 1, totalLosses: 3, totalDraws: 0, group: "C" },

    { name: "Sumit Shrestha", baseGHelo: 760, totalPlayed: 4, totalWins: 1, totalLosses: 3, totalDraws: 0, group: "D" },
    { name: "Vinayak Shrestha", baseGHelo: 680, totalPlayed: 8, totalWins: 1, totalLosses: 7, totalDraws: 0, group: "D" },
    { name: "Umanga Adhikari", baseGHelo: 760, totalPlayed: 2, totalWins: 0, totalLosses: 2, totalDraws: 0, group: "D" },
    { name: "Siddhartha Bhatta", baseGHelo: 700, totalPlayed: 5, totalWins: 0, totalLosses: 5, totalDraws: 0, group: "D" },
    { name: "Shahil Thapa", baseGHelo: 680, totalPlayed: 6, totalWins: 0, totalLosses: 6, totalDraws: 0, group: "D" }
];

// 2. FIXED ROUND-ROBIN GROUP SCHEDULING MATRIX
const fixedScheduleMatrix = [
    { matchNo: 1, p1Idx: 0, p2Idx: 1 },
    { matchNo: 2, p1Idx: 3, p2Idx: 4 },
    { matchNo: 3, p1Idx: 1, p2Idx: 2 },
    { matchNo: 4, p1Idx: 0, p2Idx: 3 },
    { matchNo: 5, p1Idx: 2, p2Idx: 4 },
    { matchNo: 6, p1Idx: 1, p2Idx: 3 },
    { matchNo: 7, p1Idx: 0, p2Idx: 2 },
    { matchNo: 8, p1Idx: 1, p2Idx: 4 },
    { matchNo: 9, p1Idx: 2, p2Idx: 3 },
    { matchNo: 10, p1Idx: 0, p2Idx: 4 }
];

// --- GENERATION ENGINE (Maps your exact data straight to the HTML) ---
const generatedPlayersObj = {};
const generatedMatchesArr = [];
let overallMatchCounter = 1;

initialPlayers.forEach(p => {
    generatedPlayersObj[p.name] = {
        name: p.name,
        currentGroup: p.group,
        ghelo: p.baseGHelo,
        topGHelo: p.baseGHelo,
        currentWins: 0,
        currentLosses: 0,
        currentDraws: 0,
        currentPoints: 0,
        currentGHPS: 0,
        allTimePlayed: p.totalPlayed,
        allTimeWon: p.totalWins,
        allTimeLost: p.totalLosses,
        allTimeDrawn: p.totalDraws
    };
});

["A", "B", "C", "D"].forEach(gLabel => {
    const groupPlayers = initialPlayers.filter(p => p.group === gLabel);
    fixedScheduleMatrix.forEach(m => {
        generatedMatchesArr.push({
            matchNo: overallMatchCounter++,
            stage: "group",
            group: gLabel,
            white: groupPlayers[m.p1Idx].name,
            black: groupPlayers[m.p2Idx].name,
            result: "pending",
            date: "",
            method: ""
        });
    });
});

const knockoutMatches = [
    { matchNo: 41, stage: "QF1", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 42, stage: "QF2", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 43, stage: "QF3", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 44, stage: "QF4", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 45, stage: "SF1", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 46, stage: "SF2", white: "", black: "", result: "pending", date: "", method: "" },
    { matchNo: 47, stage: "Final", white: "", black: "", result: "pending", date: "", method: "" }
];
generatedMatchesArr.push(...knockoutMatches);

window.tournamentDatabaseBaseline = {
    players: generatedPlayersObj,
    currentMatches: generatedMatchesArr
};