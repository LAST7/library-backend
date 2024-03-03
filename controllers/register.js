import jwt from "jsonwebtoken";
import { hash } from "bcrypt";
import Router from "express";
import { makeQueryPromise, makeInsertPromise } from "../utils/dbUtils.js";

const registerRouter = Router();

registerRouter.post("/", async (req, res, next) => {
    // TODO: write middleware to ensure data in request body
    const { studentId, username, password } = req.body;

    if (studentId.length !== 7) {
        return res.status(400).json({
            error: "无效的学号",
        });
    }

    try {
        // Check if student id exists & get the student's name
        const queryString =
            `SELECT Student.student_id, username, name ` +
            `FROM Student LEFT OUTER JOIN User ` +
            `ON Student.student_id = User.student_id ` +
            `WHERE Student.student_id = ?`;
        const studentResult = await makeQueryPromise(queryString, [studentId]);

        if (studentResult.length === 0) {
            return res.status(401).json({
                error: "学号不存在",
            });
        } else if (studentResult[0].username) {
            return res.status(409).json({
                error: "该学号已注册，请前往登录",
            });
        }

        // Store the user to the database
        const name = studentResult[0].name;
        // Hash the password
        const saltRound = 12;
        const passwordHash = await hash(password, saltRound);

        // Insert the new user
        const insertUser = `INSERT INTO User (student_id, username, password) VALUES (?, ?, ?)`;
        const insertResult = await makeInsertPromise(insertUser, [
            studentId,
            username,
            passwordHash,
        ]);

        // generate token
        const tokenContent = {
            username,
            user_id: insertResult.insertId,
        };
        const token = jwt.sign(tokenContent, process.env.SECRET, {
            expiresIn: "1h",
        });

        return res.status(201).json({ token, username, name });
    } catch (err) {
        next(err);
        return res.status(500).end();
    }
});

export default registerRouter;
