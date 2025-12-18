import jwt from "jsonwebtoken";

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

export { generateToken };
