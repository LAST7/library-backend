import jwt from "jsonwebtoken";

import { info, error } from "./logger.js";
import { makeSQLPromise } from "./dbUtils.js";

const requestLogger = (request, response, next) => {
    info("Method: ", request.method);
    info("Path:   ", request.path);
    info("Body:   ", request.body);
    info("---");
    next();
};

const tokenExtractor = (request, response, next) => {
    const auth = request.get("authorization");
    if (auth && auth.startsWith("Bearer ")) {
        request.token = auth.replace("Bearer ", "");
    }

    next();
};

const userExtractor = async (request, response, next) => {
    const extractedToken = request.token;
    if (extractedToken) {
        try {
            const tokenContent = jwt.verify(extractedToken, process.env.SECRET);
            if (!tokenContent.user_id) {
                return response.status(401).json({
                    error: "无效的 token，错误的用户类型",
                });
            }
            const user_id = tokenContent.user_id;

            // verify user inside database
            const queryUser = `SELECT * FROM User WHERE user_id = ?`;
            const userResult = await makeSQLPromise(queryUser, [user_id]);
            if (userResult.length === 0) {
                return response.status(401).json({
                    error: "无效的 token，用户不存在",
                });
            }

            request.user = {
                user_id,
            };
        } catch (exception) {
            // Mostly token expired
            next(exception);
        }
    }

    next();
};

const adminExtractor = async (request, response, next) => {
    const extractedToken = request.token;
    if (extractedToken) {
        try {
            const tokenContent = jwt.verify(extractedToken, process.env.SECRET);
            if (!tokenContent.admin_id) {
                return response.status(401).json({
                    error: "无效的 token，错误的用户类型",
                });
            }
            const admin_id = tokenContent.admin_id;

            // verify admin inside database
            const queryAdmin = `SELECT * FROM Admin WHERE admin_id = ?`;
            const adminResult = await makeSQLPromise(queryAdmin, [admin_id]);
            if (adminResult.length === 0) {
                return response.status(401).json({
                    error: "无效的 token，管理员账号不存在",
                });
            }

            request.admin = {
                admin_id,
            };
        } catch (exception) {
            next(exception);
        }
    }

    next();
};

const errorHandler = (err, request, response, next) => {
    error(err.message);

    if (err.name === "CastError") {
        return response.status(400).send({ error: "malformatted id" });
    } else if (err.name === "ValidationError") {
        return response.status(400).json({ error: err.message });
    } else if (err.name === "JsonWebTokenError") {
        return response.status(401).json({ error: err.message });
    } else if (err.name === "TokenExpiredError") {
        return response.status(401).json({ error: "token expired" });
    }

    next(err);
};

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: "unknown endpoint" });
};

export {
    requestLogger,
    tokenExtractor,
    userExtractor,
    adminExtractor,
    errorHandler,
    unknownEndpoint,
};
