import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";

const seatRouter = Router();

seatRouter.get("/", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    // exracted by userExtractor from middleware
    const { user_id } = req.user;
    if (!user_id) {
        return res.status(401).json({
            error: "无效的 token，请重新登录",
        });
    }

    try {
        const querySeat =
            `SELECT * FROM Seat JOIN Floor ` +
            `WHERE Seat.floor_level = Floor.floor_level`;
        const seatResult = await makeSQLPromise(querySeat);

        return res.status(200).send({
            seatResult,
        });
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

export default seatRouter;
