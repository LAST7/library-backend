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
            const user_id = jwt.verify(
                extractedToken,
                process.env.SECRET,
            ).user_id;

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
    errorHandler,
    unknownEndpoint,
};
