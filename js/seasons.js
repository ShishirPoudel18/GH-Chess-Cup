// js/seasons.js

window.addEventListener("DOMContentLoaded", () => {
    renderSeasonsArchive();
});

function renderSeasonsArchive() {
    // Static historical metadata array matching target specs
    const archives = [
        { id: 8, title: "Season 8", players: 20, matches: 47, gold: "Player TBD", silver: "Player TBD", bronze: "Player TBD", status: "Ongoing / Current" },
        { id: 7, title: "Season 7", players: 16, matches: 39, gold: "Champion 7", silver: "RunnerUp 7", bronze: "ThirdPlace 7", status: "Archived" },
        { id: 6, title: "Season 6", players: 16, matches: 39, gold: "Champion 6", silver: "RunnerUp 6", bronze: "ThirdPlace 6", status: "Archived" },
        { id: 5, title: "Season 5", players: 12, matches: 27, gold: "Champion 5", silver: "RunnerUp 5", bronze: "ThirdPlace 5", status: "Archived" },
        { id: 4, title: "Season 4", players: 12, matches: 27, gold: "Champion 4", silver: "RunnerUp 4", bronze: "ThirdPlace 4", status: "Archived" },
        { id: 3, title: "Season 3", players: 10, matches: 23, gold: "Champion 3", silver: "RunnerUp 3", bronze: "ThirdPlace 3", status: "Archived" },
        { id: 2, title: "Season 2", players: 8,  matches: 17, gold: "Champion 2", silver: "RunnerUp 2", bronze: "ThirdPlace 2", status: "Archived" },
        { id: 1, title: "Season 1", players: 8,  matches: 17, gold: "Champion 1", silver: "RunnerUp 1", bronze: "ThirdPlace 1", status: "Archived" }
    ];

    const container = document.getElementById("archive-container");
    let html = "";

    archives.forEach(s => {
        html += `
        <div class="box" style="background: #1e293b; border: 1px solid #334155; position: relative;">
            <span style="position: absolute; top: 15px; right: 15px; font-size: 0.75rem; background: ${s.status === 'Archived' ? '#334155' : '#1e3a8a'}; padding: 4px 8px; border-radius: 12px; color: #cbd5e1;">
                ${s.status}
            </span>
            <h3 style="margin-top: 0; padding-bottom: 5px; color: #3b82f6;">${s.title}</h3>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 5px 0;">Total Participants: <b>${s.players}</b></p>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 5px 0;">Total Matches Scheduled: <b>${s.matches}</b></p>
            
            <ul class="podium-list">
                <li><span>🥇 1st Place:</span> <span class="gold">${s.gold}</span></li>
                <li><span>🥈 2nd Place:</span> <span class="silver">${s.silver}</span></li>
                <li><span>🥉 3rd Place:</span> <span class="bronze">${s.bronze}</span></li>
            </ul>
        </div>`;
    });

    container.innerHTML = html;
}