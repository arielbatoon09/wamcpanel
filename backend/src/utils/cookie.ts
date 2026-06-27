import type { Request, Response, CookieOptions } from "express";

interface AuthCookieOptions {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookies = (req: Request, res: Response, tokens: AuthCookieOptions) => {
  const isSecure = req.secure;
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "strict" : "lax",
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

export const clearAuthCookies = (req: Request, res: Response) => {
  const isSecure = req.secure;
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
};
