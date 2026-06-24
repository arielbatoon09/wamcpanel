import { injectable, inject } from "tsyringe";
import { UserRepository } from "@/repositories/user-repository";
import { hashPassword } from "@/utils/password";
import { ConflictException } from "@/exceptions";

@injectable()
export class SignupService {
  constructor(@inject(UserRepository) private readonly userRepository: UserRepository) {}

  public async execute(data: { name?: string | null; email: string; password: string }) {
    await this.ensureEmailIsUnique(data.email);

    const userCount = await this.userRepository.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const createdUser = await this.registerUser(data.name, data.email, data.password, role);

    return {
      message: "Created account successfully!",
      data: { user: createdUser },
    };
  }

  private async ensureEmailIsUnique(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }
  }

  private async registerUser(name: string | null | undefined, email: string, password: string, role: "USER" | "ADMIN") {
    const hashedPassword = await hashPassword(password);
    return this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
  }
}
