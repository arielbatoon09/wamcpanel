import { AccessSection } from "@/components/features/access/access-section";

export const metadata = {
  title: "Server Panel - Access",
  description: "Grant server control access to administrators and support personnel.",
};

export default function AccessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Access Management</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage system users, invite administrators, and configure security roles.</p>
      </div>

      {/* Access Section */}
      <AccessSection />
    </div>
  );
}
