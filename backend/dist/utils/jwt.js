import jwt from 'jsonwebtoken';
import config from '../config/environment';
// Helper function to sign token
const signToken = (payload, secret, expiresIn) => {
    const options = { expiresIn: expiresIn };
    return jwt.sign(payload, secret, options);
};
export const generateAccessToken = (payload) => {
    return signToken(payload, config.jwt.secret, config.jwt.expiry);
};
export const generateRefreshToken = (payload) => {
    return signToken(payload, config.jwt.refreshSecret, config.jwt.refreshExpiry);
};
export const verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwt.secret);
};
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refreshSecret);
};
export const decodeToken = (token) => {
    return jwt.decode(token);
};
//# sourceMappingURL=jwt.js.map