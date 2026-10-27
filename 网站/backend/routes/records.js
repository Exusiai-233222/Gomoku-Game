const express = require("express");
const pool = require("../db");
const { requireLogin } = require("../middleware/auth");
const { getUserStats } = require("../services/ranking");

const router = express.Router();

/** 提交一局五子棋成绩 */
router.post("/", requireLogin, async (req, res, next) => {
  try {
    // 接收前端传来的结果：1=胜, 2=负, 3=平局，以及用时
    const result = Number(req.body.result);
    const durationMs = Number(req.body.durationMs);

    // 校验数据合法性
    if (
      ![1, 2, 3].includes(result) ||
      !Number.isInteger(durationMs) ||
      durationMs < 1000
    ) {
      return res.status(400).json({ error: "成绩数据不合法" });
    }

    // 插入到新表 gomoku_records
    await pool.execute(
      `INSERT INTO gomoku_records (user_id, result, duration_ms) VALUES (?, ?, ?)`,
      [req.session.userId, result, durationMs],
    );

    // 获取最新排名
    const stats = await getUserStats(req.session.userId);

    res.status(201).json({
      ok: true,
      message: "成绩已记录",
      stats: stats[0], // 返回个人的胜败数据
    });
  } catch (error) {
    next(error);
  }
});

/** 我的成绩汇总（个人中心调用） */
router.get("/me", requireLogin, async (req, res, next) => {
  try {
    const stats = await getUserStats(req.session.userId);
    res.json({ ok: true, stats: stats[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
