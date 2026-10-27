import { api, requireUser, logout } from "./api.js";
import { mountNav } from "./nav.js";

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileJoined = document.getElementById("profileJoined");
const avatar = document.getElementById("avatar");
const statsGrid = document.getElementById("statsGrid");

const passwordForm = document.getElementById("passwordForm");
const oldPassword = document.getElementById("oldPassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");
const passwordSuccess = document.getElementById("passwordSuccess");

async function loadProfile() {
  try {
    const user = await requireUser();
    if (!user) return;
    mountNav(user);

    // 渲染基本信息
    profileName.textContent = user.username;
    profileEmail.textContent = user.email;
    profileJoined.textContent = `加入时间：${new Date(user.createdAt).toLocaleDateString()}`;
    avatar.textContent = user.username.charAt(0).toUpperCase();

    // 请求最新的五子棋战绩
    const data = await api("/records/me");
    const stat = data.stats;

    // 动态生成战绩卡片
    statsGrid.innerHTML = `
      <section class="card" style="width: 100%;">
        <h2><span class="dot"></span>五子棋战绩</h2>
        <div style="display: flex; gap: 30px; margin-top: 15px; font-size: 18px;">
          <p>总场次：<strong>${stat.total}</strong></p>
          <p>胜场：<strong style="color: #00cc66;">${stat.wins}</strong></p>
          <p>败场：<strong style="color: #ff4444;">${stat.losses}</strong></p>
          <p>平局：<strong>${stat.draws}</strong></p>
        </div>
        <p style="margin-top: 10px; color: #888;">全站排名：第 <strong>${stat.rank || "-"}</strong> 名 / 共 ${stat.totalPlayers} 人</p>
      </section>
    `;
  } catch (error) {
    console.error("加载个人信息失败", error);
  }
}

// 处理修改密码
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  passwordError.textContent = "";
  passwordSuccess.textContent = "";

  if (newPassword.value !== confirmPassword.value) {
    passwordError.textContent = "两次输入的新密码不一致";
    return;
  }

  try {
    const res = await api("/password", {
      method: "POST",
      body: { oldPassword: oldPassword.value, newPassword: newPassword.value },
    });
    passwordSuccess.textContent = res.message;
    passwordForm.reset();
  } catch (error) {
    passwordError.textContent = error.message;
  }
});

document.getElementById("authBtn").addEventListener("click", () => logout());

loadProfile();
