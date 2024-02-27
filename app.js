import config from "./utils/config.js";

import express from "express";
import cors from "cors";

import loginRouter from "./controllers/login.js";

import { requestLogger } from "./utils/middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(requestLogger);

app.use("/api/login", loginRouter);

export default app;
