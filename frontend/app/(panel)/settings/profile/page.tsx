import { ProfileSettingsForm } from "@/components/features/settings/profile-settings-form";

export const metadata = {
  title: "Server Panel - Profile Settings",
  description: "Configure your personal display name, change password, and account security details.",
};

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Personal Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Configure your account display name, email identity, and manage password updates.</p>
      </div>

      <ProfileSettingsForm />
    </div>
  );
}
