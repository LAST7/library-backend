import jwt from "jsonwebtoken";
import Router, { response } from "express";

const loginRouter = Router();

const mockUser = {
    username: "123",
    password: "123",
};

loginRouter.post("/student", async (req, res) => {
    const { username, password } = req.body;

    // TODO: mock data
    if (mockUser.username === username && mockUser.password === password) {
        const tokenInfo = {
            username: username,
            id: "1234",
        };
        const token = jwt.sign(tokenInfo, process.env.SECRET, {
            expiresIn: 10,
        });

        console.log("test");
        res.status(200).send({ token, username: mockUser.username });
    }
});

export default loginRouter;
