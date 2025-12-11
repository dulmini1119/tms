import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants.js";
import bcrypt from "bcrypt";
import ApiResponse from "../../utils/response.js";
import { AuthRequest } from "../../middleware/auth.js";
import { AuthService } from "./auth.service.js"; // ← ADD THIS IMPORT
import { token } from "morgan";

// Body interfaces
interface ForgotPasswordBody {
  email: string;
}
interface ResetPasswordBody {
  email: string;
  otp: string;
  newPassword: string;
}

export class AuthController {
  // ← ADD THIS LINE — create the service instance
  private authService = new AuthService();

  // ==================================================================
  // LOGIN
// auth.controller.ts
login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;

    const result = await this.authService.login(email, password, rememberMe);

    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000; // 7 days

    // Access token cookie (15 mins)
    res.cookie("accessToken", result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    // Refresh token cookie
    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // Send only safe data — no token in body!
    ApiResponse.success(res, {
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};
// ==================================================================

  // ==================================================================
  // REGISTER (you can remove if only admin creates users)
  // ==================================================================
  register = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      ApiResponse.created(res, { user }, "User registered successfully");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // REFRESH TOKEN
  // ==================================================================
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          "No refresh token",
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const result = await this.authService.refreshToken(refreshToken);
      ApiResponse.success(res, result, "Token refreshed");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // LOGOUT
  // ==================================================================
  logout = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      res.clearCookie("refreshToken", { path: "/" });
      ApiResponse.success(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // CHANGE PASSWORD
  // ==================================================================
  changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!req.user?.id)
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          "Unauthorized",
          HTTP_STATUS.UNAUTHORIZED
        );

      await this.authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      ApiResponse.success(res, {}, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // GET CURRENT USER
  // ==================================================================
  getCurrentUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.id)
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          "Unauthorized",
          HTTP_STATUS.UNAUTHORIZED
        );

      const user = await this.authService.getCurrentUser(req.user.id);
      ApiResponse.success(res, { user }, "User fetched");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // FORGOT PASSWORD
  // ==================================================================
  forgotPassword = async (
    req: Request<{}, {}, ForgotPasswordBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Email not found",
          HTTP_STATUS.NOT_FOUND
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.passwordReset.deleteMany({ where: { email } });
      await prisma.passwordReset.create({
        data: { email, token: otp, expires_at },
      });

      console.log(`OTP for ${email}: ${otp}`); // Replace with email service later

      ApiResponse.success(res, {}, "OTP sent to your email");
    } catch (error) {
      next(error);
    }
  };

  // ==================================================================
  // RESET PASSWORD
  // ==================================================================
  resetPassword = async (
    req: Request<{}, {}, ResetPasswordBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, otp, newPassword } = req.body;

      const reset = await prisma.passwordReset.findFirst({
        where: { email, token: otp, expires_at: { gt: new Date() } },
      });

      if (!reset) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          "Invalid or expired OTP",
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const password_hash = await bcrypt.hash(newPassword, 10);
      await prisma.users.update({ where: { email }, data: { password_hash } });
      await prisma.passwordReset.delete({ where: { id: reset.id } });

      ApiResponse.success(res, {}, "Password reset successful");
    } catch (error) {
      next(error);
    }
  };
}
