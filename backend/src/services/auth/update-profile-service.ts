import { injectable, inject } from "tsyringe";
import { UserRepository } from "@/repositories/user-repository";
import { verifyPassword, hashPassword } from "@/utils/password";
import { BadRequestException, NotFoundException } from "@/exceptions";

@injectable()
export class UpdateProfileService {
  constructor(@inject(UserRepository) private readonly userRepository: UserRepository) { }

  public async execute(userId: string, data: { name?: string; currentPassword?: string; newPassword?: string }) {
    const { name, currentPassword, newPassword } = data;

    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        throw new BadRequestException("Current password is required to set a new password");
      }
      if (!user.password) {
        throw new BadRequestException("Password change not supported for this account");
      }
      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException("Current password is incorrect");
      }
      const newHash = await hashPassword(newPassword);
      await this.userRepository.updatePassword(userId, newHash);
    }

    // Handle name update if provided
    const profileData = name !== undefined
      ? await this.userRepository.updateProfile(userId, { name })
      : { id: user.id, name: user.name, email: user.email, role: user.role };

    return {
      message: "Profile updated successfully",
      data: {
        user: {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role,
        },
      },
    };
  }
}
