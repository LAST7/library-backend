import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const SECRET = process.env.SECRET;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWD = process.env.DB_PASSWD;

export default {
    PORT,
    SECRET,
    DB_HOST,
    DB_USER,
    DB_NAME,
    DB_PASSWD,
};
