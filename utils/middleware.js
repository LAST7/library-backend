import { info, error } from "./logger.js";

const requestLogger = (request, response, next) => {
    info("Method: ", request.method);
    info("Path:   ", request.path);
    info("Body:   ", request.body);
    info("---");
    next();
};

export { requestLogger };
