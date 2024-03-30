import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";

const penaltyRouter = Router();

penaltyRouter.get("/info", async (req, res, next) => {
    try {
        // exracted by userExtractor from middleware
        const { user_id } = req.user;

        const queryPenalty =
            "SELECT penalty_id, Admin.name as adminName, PenaltyType.reason , until " +
            "FROM Penalty JOIN Admin ON Penalty.admin_id = Admin.admin_id " +
            "JOIN PenaltyType ON Penalty.penalty_type_id = PenaltyType.penalty_type_id " +
            "WHERE user_id = ?";
        const penaltyResult = await makeSQLPromise(queryPenalty, [user_id]);

        return res.status(200).send(penaltyResult);
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

export default penaltyRouter;
