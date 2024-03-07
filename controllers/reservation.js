import { Router } from "express";

import { makeSQLPromise } from "../utils/dbUtils.js";
import { scheduleTask } from "../utils/utils.js";

const reservationRouter = Router();

const releaseSeat = (seat_id) => {
    const updateSeat = `Update Seat SET available = 1 WHERE seat_id = ?`;
    makeSQLPromise(updateSeat, [seat_id]);
};

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

    const { seat_number, iTime, oTime } = req.body;
    // availability check
    try {
        const queryAvail =
            `SELECT seat_id, open, available ` +
            `FROM Seat JOIN Floor ON Seat.floor_level = Floor.floor_level ` +
            `WHERE seat_number = ?`;
        const availResult = await makeSQLPromise(queryAvail, [seat_number]);

        if (availResult.length === 0) {
            return res.status(400).json({
                error: "未知的座位编号",
            });
        }

        // `seatAvail` and `floorAvail` should be number type, 1 for true and 0 for false
        // welcome to javascript
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

        // update seat status
        const seat_id = availResult[0].seat_id;
        const updateSeat = `UPDATE Seat SET available = 0 WHERE seat_id = ?`;
        const updateResult = await makeSQLPromise(updateSeat, [seat_id]);

        const currentTime = new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");
        // insert reservation
        const insertReservation =
            `INSERT INTO Reservation (user_id, seat_id, reservation_time, check_in_time, check_out_time) ` +
            `VALUES (?, ?, ?, ?, ?)`;
        const insertResult = await makeSQLPromise(insertReservation, [
            user_id,
            seat_id,
            currentTime,
            iTime,
            oTime,
        ]);
        scheduleTask(new Date(oTime), releaseSeat);

        return res.status(200).send({
            reservationId: insertResult.insertId,
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

reservationRouter.get("/info", async (req, res, next) => {
    if (!req.token) {
        return res.status(401).json({
            error: "未检测到 token，请登录",
        });
    }

    try {
        // exracted by userExtractor from middleware
        const { user_id } = req.user;
        if (!user_id) {
            return res.status(401).json({
                error: "无效的 token，请重新登录",
            });
        }

        const queryReservation =
            `SELECT reservation_id, seat_number, floor_level, reservation_time, check_in_time, check_out_time ` +
            `FROM Reservation JOIN Seat ON Reservation.seat_id = Seat.seat_id ` +
            `WHERE Reservation.user_id = ?`;
        const reservationResult = await makeSQLPromise(queryReservation, [
            user_id,
        ]);

        return res.status(200).send({
            reservationResult,
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
