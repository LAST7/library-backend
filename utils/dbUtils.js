import mysql from "mysql";

import config from "./config.js";
import { info, error } from "./logger.js";

let DB;
const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 10;

const createConnection = () => {
    return mysql.createConnection({
        host: config.DB_HOST,
        user: config.DB_USER,
        database: config.DB_NAME,
        password: config.DB_PASSWD,
        timezone: "utc",
    });
};

const connecWithRetry = (retryCount = 0) => {
    DB = createConnection();

    DB.connect((err) => {
        if (err) {
            error("Error connecting to database: ", err);
            if (MAX_RETRIES !== 0 && retryCount > MAX_RETRIES) {
                error("Max retries reached. Exiting...");
                process.exit(1);
            }

            info(
                `Retrying in ${RETRY_INTERVAL / 1000}s... (Attempt ${retryCount + 1}${MAX_RETRIES ? "/" + MAX_RETRIES : ""})`,
            );
            setTimeout(() => connecWithRetry(retryCount + 1), RETRY_INTERVAL);
        } else {
            info("Connected to Database");
        }
    });
};

process.on("SIGINT", () => {
    info("Received SIGINT. Closing database connection...");
    DB.end((err) => {
        if (err) {
            error("Error closing database connection: ", err);
            process.exit(0);
        } else {
            info("Database connection closed.");
            process.exit(0);
        }
    });
});

// Connect to Database
connecWithRetry();

/**
 * Executes a database query asynchronously and returns a promise.
 * This function takes a SQL query command and optional values,
 * sends the query to the database using the DB.query method,
 * and resolves or rejects a promise based on the query execution result.
 * @param {string} queryString The SQL query command.
 * @param {Array} [values=[]] An optional array of values to be interpolated into the query.
 * @returns {Promise<Array>} A promise that resolves with an array of query results upon successful execution,
 *                           or rejects with an error if an issue occurs during the query execution.
 *                           The array of query results contains the retrieved data from the database.
 * @example
 * const queryString = "SELECT * FROM Users WHERE age > ?";
 * const values = [18];
 * makeQueryPromise(queryString, values)
 *   .then(results => {
 *       console.log("Query results:", results);
 *   })
 *   .catch(error => {
 *       console.error("Error executing query:", error);
 *   });
 */
export const makeSQLPromise = (queryString, values) => {
    return new Promise((resolve, reject) => {
        DB.query(queryString, values, (err, results) => {
            if (err) {
                error(`Error executing ${queryString} + ${values}: ${err}`);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
