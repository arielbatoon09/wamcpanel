import { injectable, inject } from "tsyringe";
import { UserRepository } from "@/repositories/user-repository";

@injectable()
export class OnboardingStatusService {
  constructor(@inject(UserRepository) private readonly userRepository: UserRepository) {}

  public async execute() {
    const userCount = await this.userRepository.count();
    return {
      message: "Onboarding status fetched successfully",
      data: {
        onboarded: userCount > 0,
      },
    };
  }
}
