import { injectable, inject } from "tsyringe";
import type { Request, Response } from "express";
import { BaseController } from "@/controllers/base-controller";
import { AsyncController } from "@/lib/decorators";
import { OnboardingStatusService, SignupService, LoginWithEmailService, RefreshTokenService, LogoutService, UpdateProfileService } from "@/services/auth";
import { UserRepository } from "@/repositories/user-repository";
import { setAuthCookies, clearAuthCookies } from "@/utils/cookie";

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject(OnboardingStatusService) private readonly onboardingStatusService: OnboardingStatusService,
    @inject(SignupService) private readonly signupService: SignupService,
    @inject(LoginWithEmailService) private readonly loginService: LoginWithEmailService,
    @inject(RefreshTokenService) private readonly refreshTokenService: RefreshTokenService,
    @inject(LogoutService) private readonly logoutService: LogoutService,
    @inject(UpdateProfileService) private readonly updateProfileService: UpdateProfileService,
    @inject(UserRepository) private readonly userRepository: UserRepository
  ) {
    super();
  }

  @AsyncController()
  async me(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.unauthorized("User not found");
    }
    return this.ok(res, { user }, "User profile retrieved successfully");
  }

  @AsyncController()
  async onboardingStatus(req: Request, res: Response) {
    const result = await this.onboardingStatusService.execute();
    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async signup(req: Request, res: Response) {
    const { name, email, password } = req.body ?? {};
    const result = await this.signupService.execute({ name, email, password });
    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    const result = await this.loginService.execute({ email, password });

    if (result.data?.tokens) {
      const { accessToken, refreshToken, expiresIn } = result.data.tokens;
      const useCookies = req.headers["x-use-cookies"] !== "false";

      if (useCookies) {
        setAuthCookies(req, res, { refreshToken });
        (result.data as any).tokens = {
          accessToken,
          expiresIn,
        };
      }
    }

    return this.ok(res, result.data, result.message);
  }

  @AsyncController()
  async refreshToken(req: Request, res: Response) {
    const useCookies = req.headers["x-use-cookies"] !== "false";
    const refreshToken = useCookies ? req.cookies?.refreshToken : req.body?.refreshToken;

    try {
      const result = await this.refreshTokenService.execute({ refreshToken });

      if (result.data?.tokens) {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = result.data.tokens;

        if (useCookies) {
          setAuthCookies(req, res, { refreshToken: newRefreshToken });
          (result.data as any).tokens = {
            accessToken,
            expiresIn,
          };
        }
      }

      return this.ok(res, result.data, result.message);
    } catch (error) {
      if (useCookies) {
        clearAuthCookies(req, res);
      }
      throw error;
    }
  }

  @AsyncController()
  async logout(req: Request, res: Response) {
    const useCookies = req.headers["x-use-cookies"] !== "false";
    const refreshToken = useCookies ? req.cookies?.refreshToken : req.body?.refreshToken;

    const result = await this.logoutService.execute({ refreshToken });

    if (useCookies) {
      clearAuthCookies(req, res);
    }

    return this.ok(res, undefined, result.message);
  }

  @AsyncController()
  async updateProfile(req: Request, res: Response) {
    const userId = (req as any).user?.sub;
    const { name, currentPassword, newPassword } = req.body ?? {};
    const result = await this.updateProfileService.execute(userId, { name, currentPassword, newPassword });
    return this.ok(res, result.data, result.message);
  }
}
