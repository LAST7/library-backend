import express from "express";
import cors from "cors";

import loginRouter from "./controllers/login.js";
import registerRouter from "./controllers/register.js";
import userRouter from "./controllers/user.js";
import reservationRouter from "./controllers/reservation.js";
import seatRouter from "./controllers/seat.js";
import penaltyRouter from "./controllers/penalty.js";

import {
    errorHandler,
    requestLogger,
    tokenExtractor,
    unknownEndpoint,
    userExtractor,
} from "./utils/middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(requestLogger);
app.use(tokenExtractor);

app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/user", userExtractor, userRouter);
app.use("/api/reservation", userExtractor, reservationRouter);
app.use("/api/seat", userExtractor, seatRouter);
app.use("/api/penalty", userExtractor, penaltyRouter);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
