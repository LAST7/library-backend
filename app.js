import express from "express";
import cors from "cors";

import loginRouter from "./controllers/login.js";
import registerRouter from "./controllers/register.js";

import {
    errorHandler,
    requestLogger,
    unknownEndpoint,
} from "./utils/middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(requestLogger);

app.use("/api/user/login", loginRouter);
app.use("/api/user/register", registerRouter);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
