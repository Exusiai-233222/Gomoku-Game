import { api, requireUser, logout } from "./api.js";
import { mountNav } from "./nav.js";

const canvas = document.getElementById("gomokuCanvas");
const ctx = canvas.getContext("2d");
const turnDisplay = document.getElementById("turnDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const statusEl = document.getElementById("status");
const undoBtn = document.getElementById("undoBtn");
const restartBtn = document.getElementById("restartBtn");
const bestLevelEl = document.getElementById("bestLevel");
const myRankEl = document.getElementById("myRank");

let startTime = 0;
let timerInterval = null;

// 加载个人战绩
async function loadStats() {
  try {
    const data = await api("/records/me");
    bestLevelEl.textContent = `${data.stats.wins} 胜`;
    myRankEl.textContent = `${data.stats.losses} 负`;
  } catch (error) {
    console.error("加载战绩失败", error);
  }
}

// 封装五子棋逻辑
function initGomoku() {
  const boardSize = 15;
  const cellSize = 40;
  const padding = 20;
  const turnTime = 30;

  let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  let currentPlayer = 1; // 1黑(你) 2白(对手)
  let isGameOver = false;
  let timeLeft = turnTime;
  let totalMoves = 0;
  let history = [];

  turnDisplay.textContent = "黑棋 (你)";
  turnDisplay.style.color = "#ffcc00";
  timerDisplay.textContent = timeLeft;
  undoBtn.disabled = true;
  isGameOver = false;
  startTime = Date.now();
  statusEl.textContent = "你执黑先行。游戏结束会自动记录成绩！";
  statusEl.style.color = "#fff";

  startTimer();
  drawBoard();

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isGameOver) return;
      timeLeft--;
      timerDisplay.textContent = timeLeft;
      if (timeLeft <= 0) {
        // 超时
        const winner = currentPlayer === 1 ? "白棋" : "黑棋";
        gameOver(winner, "超时判负");
      }
    }, 1000);
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    // 画网格
    for (let i = 0; i < boardSize; i++) {
      let pos = padding + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(canvas.width - padding, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, canvas.height - padding);
      ctx.stroke();
    }
    // 画棋子
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        if (board[r][c] !== 0) drawPiece(c, r, board[r][c]);
      }
    }
  }

  function drawPiece(col, row, player) {
    let x = padding + col * cellSize;
    let y = padding + row * cellSize;
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = player === 1 ? "#000" : "#fff";
    ctx.fill();
    ctx.stroke();
  }

  // 鼠标点击落子
  canvas.onclick = (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (
      col >= 0 &&
      col < boardSize &&
      row >= 0 &&
      row < boardSize &&
      board[row][col] === 0
    ) {
      board[row][col] = currentPlayer;
      totalMoves++;
      history.push({ row, col, player: currentPlayer });
      undoBtn.disabled = false;
      drawBoard();

      if (checkWin(row, col, currentPlayer)) {
        gameOver(currentPlayer === 1 ? "黑棋" : "白棋", "五子连珠");
      } else if (totalMoves === boardSize * boardSize) {
        gameOver("平局", "棋盘已满");
      } else {
        // 切换回合
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        turnDisplay.textContent =
          currentPlayer === 1 ? "黑棋 (你)" : "白棋 (对手)";
        turnDisplay.style.color = currentPlayer === 1 ? "#ffcc00" : "#ffffff";
        timeLeft = turnTime; // 重置倒计时
      }
    }
  };

  // 悔棋逻辑
  undoBtn.onclick = () => {
    if (history.length === 0 || isGameOver) return;
    const lastMove = history.pop();
    board[lastMove.row][lastMove.col] = 0;
    totalMoves--;

    // 把回合交还给上一步的人
    currentPlayer = lastMove.player;
    turnDisplay.textContent = currentPlayer === 1 ? "黑棋 (你)" : "白棋 (对手)";
    turnDisplay.style.color = currentPlayer === 1 ? "#ffcc00" : "#ffffff";
    timeLeft = turnTime;
    timerDisplay.textContent = timeLeft;

    if (history.length === 0) undoBtn.disabled = true;
    drawBoard();
  };

  // 重新开始
  restartBtn.onclick = () => {
    if (timerInterval) clearInterval(timerInterval);
    initGomoku();
  };

  // 判断输赢
  function checkWin(row, col, player) {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    for (let [dr, dc] of dirs) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        let nr = row + dr * i,
          nc = col + dc * i;
        if (
          nr >= 0 &&
          nr < boardSize &&
          nc >= 0 &&
          nc < boardSize &&
          board[nr][nc] === player
        )
          count++;
        else break;
      }
      for (let i = 1; i < 5; i++) {
        let nr = row - dr * i,
          nc = col - dc * i;
        if (
          nr >= 0 &&
          nr < boardSize &&
          nc >= 0 &&
          nc < boardSize &&
          board[nr][nc] === player
        )
          count++;
        else break;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 游戏结束（自动记录成绩）
  async function gameOver(winner, reason) {
    isGameOver = true;
    clearInterval(timerInterval);
    const durationMs = Date.now() - startTime;

    // 你执黑 (currentPlayer=1)，如果你赢了传 1，输了传 2，平局传 3
    let resultCode = 3;
    let resultText = "平局";
    if (winner === "黑棋") {
      resultCode = 1;
      resultText = "你赢了！";
    }
    if (winner === "白棋") {
      resultCode = 2;
      resultText = "你输了！";
    }

    statusEl.textContent = `${resultText} (${reason})，正在保存成绩...`;
    statusEl.style.color = "#ffcc00";

    try {
      await api("/records", {
        method: "POST",
        body: { result: resultCode, durationMs: durationMs },
      });
      statusEl.textContent = `${resultText} 成绩已保存！点击“重新开始”再战。`;
      statusEl.style.color =
        resultCode === 1 ? "#00cc66" : resultCode === 2 ? "#ff4444" : "#fff";
      loadStats(); // 刷新侧边栏的胜败数据
    } catch (err) {
      statusEl.textContent = `成绩保存失败：${err.message}`;
      statusEl.style.color = "#ff4444";
    }
  }
}

// 初始化页面
async function init() {
  const user = await requireUser();
  if (!user) return;

  mountNav(user);
  loadStats(); // 加载胜败数据
  initGomoku(); // 启动游戏

  document.getElementById("authBtn").addEventListener("click", () => logout());
}

init();
