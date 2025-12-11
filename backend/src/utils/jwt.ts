import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from '../config/environment.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Helper function to sign token
const signToken = (payload: object, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, options);
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return signToken(payload, config.jwt.secret, config.jwt.expiry);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return signToken(payload, config.jwt.refreshSecret, config.jwt.refreshExpiry);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

// Improved decodeToken: returns TokenPayload | RefreshTokenPayload | null
export const decodeToken = (token: string): TokenPayload | RefreshTokenPayload | null => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') return null;
  return decoded as TokenPayload | RefreshTokenPayload;
};
