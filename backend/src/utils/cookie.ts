import type { Response, CookieOptions } from "express";
import { envConfig } from "@/config/env";

const isProduction = envConfig.STAGE === "prod";

interface AuthCookieOptions {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookies = (res: Response, tokens: AuthCookieOptions) => {
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  if (tokens.accessToken) {
    res.cookie("accessToken", tokens.accessToken, {
      ...baseOptions,
      maxAge: 15 * 60 * 1000,
    });
  }

  if (tokens.refreshToken) {
    res.cookie("refreshToken", tokens.refreshToken, {
      ...baseOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
};
