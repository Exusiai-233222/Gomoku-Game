import { api, getCurrentUser } from "./api.js";
import { mountNav } from "./nav.js";

const leaderBody = document.getElementById("leaderBody");
const boardDesc = document.getElementById("boardDesc");
const myRankBox = document.getElementById("myRankBox");

async function loadLeaderboard() {
  boardDesc.textContent = "正在加载...";
  leaderBody.innerHTML = "";
  myRankBox.innerHTML = "";

  try {
    // 请求后端排行榜数据
    const data = await api(`/leaderboard`);
    boardDesc.textContent = `共 ${data.total} 名玩家参与`;

    if (data.entries.length === 0) {
      leaderBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">暂无对战成绩，快去下棋吧！</td></tr>`;
    } else {
      data.entries.forEach((entry) => {
        const tr = document.createElement("tr");
        if (entry.isMe) tr.style.backgroundColor = "rgba(102, 126, 234, 0.1)";

        let rankDisplay = entry.rank;
        if (entry.rank === 1) rankDisplay = "🥇 1";
        if (entry.rank === 2) rankDisplay = "🥈 2";
        if (entry.rank === 3) rankDisplay = "🥉 3";

        // 渲染胜、负、平
        tr.innerHTML = `
          <td>${rankDisplay}</td>
          <td>${entry.username} ${entry.isMe ? '<span style="color:#667eea">(我)</span>' : ""}</td>
          <td style="color: #00cc66; font-weight: bold;">${entry.wins}</td>
          <td style="color: #ff4444;">${entry.losses}</td>
          <td>${entry.draws}</td>
        `;
        leaderBody.appendChild(tr);
      });
    }

    // 显示自己的排名
    if (data.me && data.me.total > 0) {
      myRankBox.innerHTML = `我的战绩：<strong style="color:#00cc66">${data.me.wins} 胜</strong> <strong style="color:#ff4444">${data.me.losses} 负</strong> ${data.me.draws} 平，当前排名第 <strong>${data.me.rank}</strong> 名`;
    } else {
      myRankBox.innerHTML = `你还没有对战记录，快去挑战吧！`;
    }
  } catch (error) {
    boardDesc.textContent = "加载失败：" + error.message;
  }
}

async function init() {
  try {
    const user = await getCurrentUser();
    if (user) mountNav(user);
  } catch (e) {}
  loadLeaderboard();
}
init();
