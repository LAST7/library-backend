import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";
import { scheduleTask } from "../utils/utils.js";
import { error } from "../utils/logger.js";

const reservationRouter = Router();

/* const releaseSeat = (seat_id) => {
    const updateSeat = "Update Seat SET available = 1 WHERE seat_id = ?";
    makeSQLPromise(updateSeat, [seat_id]);
}; */

reservationRouter.get("/info", async (req, res, next) => {
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
        const queryReservation =
            "SELECT reservation_id, seat_number, floor_level, reservation_time, check_in_time, check_out_time, cancelled " +
            "FROM Reservation JOIN Seat ON Reservation.seat_id = Seat.seat_id " +
            "WHERE Reservation.user_id = ?";
        const reservationResult = await makeSQLPromise(queryReservation, [
            user_id,
        ]);

        return res.status(200).send(reservationResult);
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

reservationRouter.post("/", async (req, res, next) => {
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

    // TODO: should limit the number of reservation that one user can create

    try {
        // TODO: test utility
        // penalty check
        const queryPenalty =
            "SELECT penalty_id, until FROM Penalty WHERE user_id = ?";
        const penaltyResult = await makeSQLPromise(queryPenalty, [user_id]);

        const activePenalty = penaltyResult.filter(
            (p) => new Date(p.util) > new Date(),
        );
        if (activePenalty.length !== 0) {
            return res.status(401).json({
                error: `无法预订，惩罚 ${activePenalty.map((p) => p.penalty_id)} 未过期`,
            });
        }

        const { seat_number, floor_level, iTime, oTime } = req.body;
        // availability check
        const queryAvail =
            "SELECT seat_id, open, available " +
            "FROM Seat JOIN Floor ON Seat.floor_level = Floor.floor_level " +
            "WHERE seat_number = ? AND Seat.floor_level = ?";
        const availResult = await makeSQLPromise(queryAvail, [
            seat_number,
            floor_level,
        ]);

        if (availResult.length === 0) {
            return res.status(400).json({
                error: "未知的座位编号",
            });
        }
        if (availResult.length > 1) {
            error("Replicate seats on the same floor");
            return res.status(500).json({
                error: "数据库座位信息错误",
            });
        }

        // `seatAvail` and `floorAvail` should be number type, 1 for true and 0 for false
        // welcome to javascript
        const seat_id = availResult[0].seat_id;
        const seatAvail = availResult[0].available;
        const floorAvail = availResult[0].open;
        if (!floorAvail) {
            return res.status(403).json({
                error: "该座位所在的楼层未开放",
            });
        }
        if (!seatAvail) {
            return res.status(403).json({
                error: "该座位已被预订或不可使用",
            });
        }

        // check other reservation's time duration
        const queryReservation =
            "SELECT check_in_time, check_out_time " +
            "FROM Reservation " +
            "WHERE seat_id = ?";
        const reservationResult = await makeSQLPromise(queryReservation, [
            seat_id,
        ]);
        const conflictReservation = reservationResult.filter(
            (r) =>
                new Date(oTime) > new Date(r.check_in_time) &&
                new Date(iTime) < new Date(r.check_out_time),
        );
        if (conflictReservation.length !== 0) {
            return res.status(403).json({
                error: "该座位在此预约时段不可用",
            });
        }

        // update seat status
        /* const updateSeat = "UPDATE Seat SET available = 0 WHERE seat_id = ?";
        const updateResult = await makeSQLPromise(updateSeat, [seat_id]); */

        // should be UTC-0 standard date & time
        const currentTime = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        // insert reservation
        const insertReservation =
            "INSERT INTO Reservation (user_id, seat_id, reservation_time, check_in_time, check_out_time) " +
            "VALUES (?, ?, ?, ?, ?)";
        const insertResult = await makeSQLPromise(insertReservation, [
            user_id,
            seat_id,
            currentTime,
            iTime,
            oTime,
        ]);
        // scheduleTask(new Date(oTime), releaseSeat);

        return res.status(200).send({
            reservationId: insertResult.insertId,
            floor_level,
            seat_number,
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

export default reservationRouter;
