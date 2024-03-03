import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import Router from "express";
import { makeQueryPromise } from "../utils/dbUtils.js";

const loginRouter = Router();

const mockUser = {
    username: "123",
    password: "123",
};

loginRouter.post("/student", async (req, res, next) => {
    const { studentId, password } = req.body;

    try {
        // Check username and password
        const queryUser =
            `SELECT user_id, username, password, name ` +
            `FROM User JOIN Student ON User.student_id = Student.student_id ` +
            `WHERE User.student_id = ?`;
        const userResult = await makeQueryPromise(queryUser, [studentId]);

        if (userResult.length === 0) {
            return res.status(401).json({
                error: "学号不存在",
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
        const name = userResult[0].name;
        const tokenContent = {
            username,
            user_id,
        };
        const token = jwt.sign(tokenContent, process.env.SECRET, {
            expiresIn: "1h",
        });

        return res.status(200).send({ token, username, name });
    } catch (err) {
        next(err);
        return res.status(500).end();
    }
});

loginRouter.post("/admin", async (req, res) => {
    const { username, password } = req.body;

    // TODO: mock data
    if (mockUser.username === username && mockUser.password === password) {
        const tokenInfo = {
            username: username,
            id: "1234",
        };
        const token = jwt.sign(tokenInfo, process.env.SECRET, {
            expiresIn: 120,
        });

        res.status(200).send({
            token,
            username: mockUser.username,
            usertype: "admin",
        });
    }
});

export default loginRouter;
