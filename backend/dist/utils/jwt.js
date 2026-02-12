import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
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
// Improved decodeToken: returns TokenPayload | RefreshTokenPayload | null
export const decodeToken = (token) => {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string')
        return null;
    return decoded;
};
//# sourceMappingURL=jwt.js.map