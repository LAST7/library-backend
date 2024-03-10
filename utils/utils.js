import jwt from "jsonwebtoken";

import { error } from "./logger.js";

/**
 * Generates a JWT token with the provided token content and expiration time.
 * This function creates a JWT token using the jsonwebtoken library, signing it with the secret key from the environment variables,
 * and setting an expiration time based on the provided expiresIn parameter.
 * @param {Object} tokenContent An object containing the payload data to be encoded into the token.
 * @param {string|number} expiresIn The expiration time for the token. This can be expressed as a numeric value representing seconds or a string describing a time span, such as "1h" for one hour.
 * @returns {string} The generated JWT token.
 */
const generateToken = (tokenContent, expiresIn) => {
    return jwt.sign(tokenContent, process.env.SECRET, {
        expiresIn,
    });
};

// TODO: should use Agenda.js instead of this util function
/**
 * Schedule a task to be executed at a specified target datetime.
 * If the target datetime has already passed, an error message is logged.
 *
 * @param {Date} targetDatetime - The datetime at which the task should be executed.
 * @param {Function} task - The task to be executed.
 * @returns {void}
 */
const scheduleTask = (targetDatetime, task) => {
    const MAX_TIMEOUT_DURATION = 2147483647; // Maximum value for a 32-bit signed integer

    const currentDatetime = new Date();
    const timeDifference = targetDatetime - currentDatetime;

    if (timeDifference <= 0) {
        error("Target datetime has already passed.");
        return;
    }

    // handle situation where timeDifference is too big to fit into a 32-bit signed integer
    if (timeDifference < MAX_TIMEOUT_DURATION) {
        setTimeout(() => {
            task();
        }, timeDifference);
    } else {
        setTimeout(() => {
            scheduleTask(targetDatetime, task);
        }, MAX_TIMEOUT_DURATION);
    }
};

export { generateToken, scheduleTask };
