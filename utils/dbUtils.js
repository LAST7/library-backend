import mysql from "mysql";

import { info, error } from "./logger.js";

const DB = mysql.createConnection({
    host: "localhost",
    user: "libraryUser",
    password: "IDontLikeWritingPapers",
    database: "library",
});
DB.on("error", (err) => {
    error("Database error: ", err);
});

process.on("SIGINT", () => {
    info("Received SIGINT. Closing database connection...");
    DB.end((err) => {
        if (err) {
            error("Error closing database connection: ", err);
        } else {
            info("Database connection closed.");
            process.exit(0);
        }
    });
});
// Connect to Database
DB.connect((err) => {
    if (err) {
        error("Error connecting to database: ", err);
    } else {
        info("Connected to Database");
    }
});
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
export const makeQueryPromise = (queryString, values) => {
    return new Promise((resolve, reject) => {
        DB.query(queryString, values, (err, results) => {
            if (err) {
                error(`Error executing ${queryString}: ${err}`);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

/**
 * Executes a database insertion query asynchronously and returns a promise.
 * This function takes an SQL insertion query command and values to be inserted,
 * sends the query to the database using the DB.query method,
 * and resolves or rejects a promise based on the query execution result.
 * @param {string} insertString The SQL insertion query command.
 * @param {Array} values An array of values to be inserted into the database.
 * @returns {Promise<Object>} A promise that resolves with an object containing information about the insertion upon successful execution,
 *                            or rejects with an error if an issue occurs during the insertion operation.
 *                            The resolved object typically contains details such as the number of affected rows and the inserted ID.
 * @example
 * const insertString = "INSERT INTO Users (name, age) VALUES (?, ?)";
 * const values = ["John", 25];
 * makeInsertPromise(insertString, values)
 *   .then(result => {
 *       console.log("Insertion result:", result);
 *   })
 *   .catch(error => {
 *       console.error("Error executing insertion query:", error);
 *   });
 */
export const makeInsertPromise = (insertString, values) => {
    return new Promise((resolve, reject) => {
        DB.query(insertString, values, (err, results) => {
            if (err) {
                error(`Error executing ${insertString}: ${err}`);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
