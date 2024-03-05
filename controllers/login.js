import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { makeQueryPromise } from "../utils/dbUtils.js";

const loginRouter = Router();

/**
 * Generates a JWT token with the provided token content and expiration time.
 * This function creates a JWT token using the jsonwebtoken library, signing it with the secret key from the environment variables,
 * and setting an expiration time based on the provided expiresIn parameter.
 * @param {Object} tokenContent An object containing the payload data to be encoded into the token.
 * @param {string|number} expiresIn The expiration time for the token. This can be expressed as a numeric value representing seconds or a string describing a time span, such as "1h" for one hour.
 * @returns {string} The generated JWT token.
 * @example
 * const tokenContent = {
 *     username: "exampleUser",
 *     user_id: 123,
 * };
 * const expiresIn = "1h";
 * const token = generateToken(tokenContent, expiresIn);
 * console.log("Generated token:", token);
 */
const generateToken = (tokenContent, expiresIn) => {
    return jwt.sign(tokenContent, process.env.SECRET, {
        expiresIn,
    });
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
        const tokenContent = {
            username,
            user_id,
        };
        const token = generateToken(tokenContent, "7d");

        const name = userResult[0].name;
        return res.status(200).send({ token, username, name });
    } catch (err) {
        next(err);
        return res.status(500).end();
    }
});

loginRouter.post("/admin", async (req, res, next) => {
    const { adminId, password } = req.body;

    try {
        const queryAdmin =
            `SELECT password, name ` + `FROM Admin ` + `WHERE admin_id = ?`;
        const adminResult = await makeQueryPromise(queryAdmin, [adminId]);

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

        //generate token
        const name = adminResult[0].name;
        const token = generateToken(
            {
                name,
                admin_id: adminId,
            },
            "1h",
        );

        return res.status(200).send({ token, name });
    } catch (err) {
        next(err);
        return res.status(500).end();
    }
});

export default loginRouter;
