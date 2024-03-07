import { Router } from "express";
import { hash, compare } from "bcrypt";

import { makeSQLPromise } from "../utils/dbUtils.js";

const userRouter = Router();

userRouter.get("/info", async (req, res, next) => {
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
        // query basic info
        const queryInfo =
            `SELECT Student.name ` +
            `FROM User JOIN Student ON User.student_id = Student.student_id ` +
            `WHERE User.user_id = ?`;
        const infoResult = await makeSQLPromise(queryInfo, [user_id]);
        const studentName = infoResult[0].name;

        // query reservation info
        const queryReservation =
            `SELECT * ` + `FROM Reservation ` + `WHERE Reservation.user_id = ?`;
        const reservationResult = await makeSQLPromise(queryReservation, [
            user_id,
        ]);
        // separate outdated reservation
        const reservationCount = reservationResult.length;
        const outdatedReservation = reservationResult.filter(
            (r) => new Date(r.check_out_time) > new Date(),
        );
        const outdated = outdatedReservation.length;
        const active = reservationCount - outdated;

        // query penalty info
        const queryPenalty =
            `SELECT count(*) as count ` +
            `FROM Penalty ` +
            `WHERE Penalty.user_id = ?`;
        const penaltyResult = await makeSQLPromise(queryPenalty, [user_id]);
        const penaltyCount = penaltyResult[0].count;

        // the student id resolved from the token somehow does not exist in the database
        if (infoResult.length === 0) {
            return res
                .status(500)
                .json({
                    error: "服务器内部错误",
                })
                .end();
        }

        // TODO: test utility
        return res.status(200).json({
            studentName,
            reservationCount: {
                active,
                outdated,
            },
            penaltyCount,
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

userRouter.put("/changepasswd", async (req, res, next) => {
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

    const { oldPasswd } = req.body;
    if (!oldPasswd) {
        return res.status(400).json({
            error: "需要验证当前密码以修改密码",
        });
    }

    try {
        const queryUser = `SELECT password FROM User WHERE user_id = ?`;
        const userResult = await makeSQLPromise(queryUser, [user_id]);

        // validate old password
        const passwordHash = userResult[0].password;
        const passwordCorrect = await compare(oldPasswd, passwordHash);
        if (!passwordCorrect) {
            return res.status(401).json({
                error: "密码错误",
            });
        }

        // update password
        const { newPasswd } = req.body;
        const saltRound = 12;
        const newPasswordHash = await hash(newPasswd, saltRound);
        const updatePassword = `UPDATE User SET password = ? WHERE user_id = ?`;
        const passwordResult = await makeSQLPromise(updatePassword, [
            newPasswordHash,
            user_id,
        ]);

        return res.status(201).end();
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

export default userRouter;
