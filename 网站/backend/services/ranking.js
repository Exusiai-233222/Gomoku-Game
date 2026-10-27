const pool = require("../db");

/** 获取某用户的个人统计与排名 */
async function getUserStats(userId) {
  // 1. 统计该用户的胜负平数据
  const [statsRows] = await pool.execute(
    `SELECT 
       SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) AS wins,
       SUM(CASE WHEN result = 2 THEN 1 ELSE 0 END) AS losses,
       SUM(CASE WHEN result = 3 THEN 1 ELSE 0 END) AS draws,
       COUNT(*) AS total
     FROM gomoku_records WHERE user_id = ?`,
    [userId],
  );

  const myStats = statsRows[0] || { wins: 0, losses: 0, draws: 0, total: 0 };
  myStats.wins = Number(myStats.wins) || 0;
  myStats.losses = Number(myStats.losses) || 0;
  myStats.draws = Number(myStats.draws) || 0;
  myStats.total = Number(myStats.total) || 0;

  // 2. 计算该用户的全站排名（胜场降序，败场升序）
  const [rankRows] = await pool.execute(
    `WITH user_stats AS (
       SELECT user_id,
              SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN result = 2 THEN 1 ELSE 0 END) AS losses
       FROM gomoku_records
       GROUP BY user_id
     ),
     ranked AS (
       SELECT user_id, wins, losses,
              ROW_NUMBER() OVER (ORDER BY wins DESC, losses ASC) AS rnk
       FROM user_stats
     )
     SELECT rnk FROM ranked WHERE user_id = ?`,
    [userId],
  );

  const rank = rankRows.length > 0 ? rankRows[0].rnk : null;

  // 3. 获取总玩家数（至少下过一局）
  const [totalRows] = await pool.execute(
    `SELECT COUNT(DISTINCT user_id) AS totalPlayers FROM gomoku_records`,
  );

  return [
    {
      wins: myStats.wins,
      losses: myStats.losses,
      draws: myStats.draws,
      total: myStats.total,
      rank: rank,
      totalPlayers: Number(totalRows[0].totalPlayers),
    },
  ];
}

/** 获取全站排行榜 */
async function getLeaderboard(currentUserId = null) {
  const [rows] = await pool.execute(
    `WITH user_stats AS (
       SELECT user_id,
              SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) AS wins,
              SUM(CASE WHEN result = 2 THEN 1 ELSE 0 END) AS losses,
              SUM(CASE WHEN result = 3 THEN 1 ELSE 0 END) AS draws
       FROM gomoku_records
       GROUP BY user_id
     ),
     ranked AS (
       SELECT user_id, wins, losses, draws,
              ROW_NUMBER() OVER (ORDER BY wins DESC, losses ASC) AS rnk
       FROM user_stats
     )
     SELECT ranked.rnk, ranked.user_id, ranked.wins, ranked.losses, ranked.draws, u.username
     FROM ranked
     JOIN users u ON u.id = ranked.user_id
     ORDER BY ranked.rnk ASC LIMIT 20`,
    [],
  );

  // 将数据库返回的下划线格式映射为前端需要的驼峰格式
  const entries = rows.map((r) => ({
    rank: r.rnk,
    username: r.username,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    isMe: r.user_id === currentUserId, // 判断是否是自己，用于前端高亮
  }));

  const myStats = currentUserId ? await getUserStats(currentUserId) : [null];

  return { total: rows.length, entries, me: myStats[0] };
}

module.exports = { getLeaderboard, getUserStats };
