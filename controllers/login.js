import { Router } from "express";
import { compare } from "bcrypt";

import { makeSQLPromise } from "../utils/dbUtils.js";
import { generateToken } from "../utils/utils.js";

const loginRouter = Router();

loginRouter.post("/student", async (req, res, next) => {
    const { studentId, password } = req.body;

    if (studentId.length !== 7) {
        return res.status(400).json({
            error: "无效的学号",
        });
    }

    try {
        // Check username and password
        const queryUser =
            `SELECT user_id, username, password, name ` +
            `FROM User JOIN Student ON User.student_id = Student.student_id ` +
            `WHERE User.student_id = ?`;
        const userResult = await makeSQLPromise(queryUser, [studentId]);

        if (userResult.length === 0) {
            return res.status(401).json({
                error: "该学号尚未注册，请前往注册",
            });
        }

        // validate password
        const passwordHash = userResult[0].password;
        const passwordCorrect = await compare(password, passwordHash);
        if (!passwordCorrect) {
            return res.status(401).json({
                error: "密码错误",
            });
        }

        // generate token
        const username = userResult[0].username;
        const user_id = userResult[0].user_id;
        const tokenContent = {
            username,
            user_id,
        };
        const token = generateToken(tokenContent, "7d");

        const name = userResult[0].name;
        // TODO: should return more info or less?
        return res.status(200).send({ token, username, name });
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

loginRouter.post("/admin", async (req, res, next) => {
    const { adminId, password } = req.body;

    try {
        const queryAdmin =
            `SELECT password, name ` + `FROM Admin ` + `WHERE admin_id = ?`;
        const adminResult = await makeSQLPromise(queryAdmin, [adminId]);

        if (adminResult.length === 0) {
            return res.status(401).json({
                error: "管理员账号不存在",
            });
        }

        // validate password
        const passwordHash = adminResult[0].password;
        const passwordCorrect = await compare(password, passwordHash);
        if (!passwordCorrect) {
            return res.status(401).json({
                error: "密码错误",
            });
        }

        // no token for admin users
        const name = adminResult[0].name;

        return res.status(200).send({ name });
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

export default loginRouter;
