import { info, error } from "./logger.js";

const requestLogger = (request, response, next) => {
    info("Method: ", request.method);
    info("Path:   ", request.path);
    info("Body:   ", request.body);
    info("---");
    next();
};

const userExtractor = async (request, response, next) => {
    const extractedToken = request.token;
    if (extractedToken) {
        try {
            const id = jwt.verify(extractedToken, process.env.SECRET).id;
            // TODO: mysql (remember to export this function)
            // const user = await User.findById(id);
            request.user = user;
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

export { requestLogger, errorHandler, unknownEndpoint };
