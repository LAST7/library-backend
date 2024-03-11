import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";

const adminRouter = Router();

adminRouter.get("/", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { admin_id } = req.admin;
    if (!admin_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const queryFloor = "SELECT * FROM Floor";
        const floorResult = await makeSQLPromise(queryFloor);

        const queryPenalty =
            "SELECT penalty_id, admin_id, reason, until, username, name FROM Penalty " +
            "JOIN PenaltyType ON Penalty.penalty_type_id = PenaltyType.penalty_type_id " +
            "JOIN User ON Penalty.user_id = User.user_id " +
            "JOIN Student ON User.student_id = Student.student_id";
        const penaltyResult = await makeSQLPromise(queryPenalty);

        return res.status(200).json({ floorResult, penaltyResult });
    } catch (err) {
        next(err);
        return res
            .status(500)
            .json({
                error: "服务器内部错误",
            })
            .end();
    }
});

adminRouter.put("/floor", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { admin_id } = req.admin;
    if (!admin_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const { floor_level, status } = req.body;

        const statusBool = status === "open" ? 1 : 0;

        const updateFloor = "UPDATE Floor SET open = ? WHERE floor_level = ?";
        const updateResult = await makeSQLPromise(updateFloor, [
            statusBool,
            floor_level,
        ]);

        return res.status(200).json({ updateResult });
    } catch (err) {
        next(err);
        return res
            .status(500)
            .json({
                error: "服务器内部错误",
            })
            .end();
    }
});

adminRouter.get("/penalty-type", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { admin_id } = req.admin;
    if (!admin_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const queryPenaltyType = "SELECT * FROM PenaltyType";
        const penaltyTypeResult = await makeSQLPromise(queryPenaltyType);

        return res.status(200).json({ penaltyTypeResult });
    } catch (err) {
        next(err);
        return res
            .status(500)
            .json({
                error: "服务器内部错误",
            })
            .end();
    }
});

adminRouter.get("/student", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { admin_id } = req.admin;
    if (!admin_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const queryStudent =
            "SELECT user_id, username, name FROM Student " +
            "JOIN User ON Student.student_id = User.student_id";
        const studentResult = await makeSQLPromise(queryStudent);

        return res.status(200).json({ studentResult });
    } catch (err) {
        next(err);
        return res
            .status(500)
            .json({
                error: "服务器内部错误",
            })
            .end();
    }
});

adminRouter.post("/penalty", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { admin_id } = req.admin;
    if (!admin_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const { user_id, admin_id, penalty_type_id, until } = req.body;

        const insertPenalty =
            "INSERT INTO Penalty (user_id, admin_id, penalty_type_id, until) " +
            "VALUES (?, ?, ?, ?)";
        const insertResult = makeSQLPromise(insertPenalty, [
            user_id,
            admin_id,
            penalty_type_id,
            until,
        ]);

        return res.status(200).json({ insertResult });
    } catch (err) {
        next(err);
        return res
            .status(500)
            .json({
                error: "服务器内部错误",
            })
            .end();
    }
});

export default adminRouter;
