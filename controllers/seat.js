import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";

const seatRouter = Router();

seatRouter.get("/info", async (req, res, next) => {
    try {
        const querySeat =
            "SELECT * FROM Seat JOIN Floor " +
            "WHERE Seat.floor_level = Floor.floor_level";
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
