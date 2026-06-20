// data/db.js

// Historical standalone records for Season 1 and Season 2
const historicalSeasons = {
    1: {
        champion: "Utsav Sapkota",
        runnerUp: "Shishir Poudel",
        leaderboard: [
            { name: "Utsav Sapkota", played: 12, won: 9 },
            { name: "Shishir Poudel", played: 12, won: 8 },
            { name: "Sushanta Karki", played: 10, won: 6 },
            { name: "Sujan Thapa", played: 10, won: 5 },
            { name: "Yusush Magar", played: 10, won: 4 }
        ],
        groups: {
            A: [
                { name: "Utsav Sapkota", played: 4, wins: 3, losses: 1, draws: 0, points: 3 },
                { name: "Shishir Poudel", played: 4, wins: 3, losses: 1, draws: 0, points: 3 },
                { name: "Sushanta Karki", played: 4, wins: 2, losses: 2, draws: 0, points: 2 },
                { name: "Sujan Thapa", played: 4, wins: 1, losses: 3, draws: 0, points: 1 },
                { name: "Yusush Magar", played: 4, wins: 1, losses: 3, draws: 0, points: 1 }
            ]
        }
    },
    2: {
        champion: "Shishir Poudel",
        runnerUp: "Utsav Sapkota",
        leaderboard: [
            { name: "Shishir Poudel", played: 12, won: 10 },
            { name: "Utsav Sapkota", played: 12, won: 8 },
            { name: "Sushanta Karki", played: 10, won: 5 },
            { name: "Sujan Thapa", played: 10, won: 4 },
            { name: "Yusush Magar", played: 10, won: 3 }
        ],
        groups: {
            A: [
                { name: "Shishir Poudel", played: 4, wins: 4, losses: 0, draws: 0, points: 4 },
                { name: "Utsav Sapkota", played: 4, wins: 3, losses: 1, draws: 0, points: 3 },
                { name: "Sushanta Karki", played: 4, wins: 1, losses: 2, draws: 1, points: 1.5 },
                { name: "Sujan Thapa", played: 4, wins: 1, losses: 3, draws: 0, points: 1 },
                { name: "Yusush Magar", played: 4, wins: 0, losses: 3, draws: 1, points: 0.5 }
            ]
        }
    }
};

// Initial Player List for Season 3 initialization
const initialPlayers = [
    { name: "Utsav Sapkota", baseGHelo: 1200, s12Wins: 17, s12Played: 24, s12Losses: 7, s12Draws: 0 },
    { name: "Shishir Poudel", baseGHelo: 1250, s12Wins: 18, s12Played: 24, s12Losses: 6, s12Draws: 0 },
    { name: "Sushanta Karki", baseGHelo: 1050, s12Wins: 11, s12Played: 20, s12Losses: 8, s12Draws: 1 },
    { name: "Sujan Thapa", baseGHelo: 980, s12Wins: 9, s12Played: 20, s12Losses: 11, s12Draws: 0 },
    { name: "Yusush Magar", baseGHelo: 920, s12Wins: 7, s12Played: 20, s12Losses: 12, s12Draws: 1 },
    // Adding structural template nodes to round out the 20 player layout
    ...Array.from({ length: 15 }, (_, i) => ({
        name: `Player ${i + 6}`,
        baseGHelo: 1000,
        s12Wins: 5,
        s12Played: 10,
        s12Losses: 5,
        s12Draws: 0
    }))
];

// Fixed round-robin index map matching your schedule structure rules
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