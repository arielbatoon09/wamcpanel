import { SettingsSection } from "@/components/features/settings/settings-section";

export const metadata = {
  title: "Server Panel - Settings",
  description: "Configure SMTP, SSH access, and system-wide settings.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Configure global SMTP email templates, backup paths, and SSH credentials.</p>
      </div>

      <SettingsSection />
    </div>
  );
}
