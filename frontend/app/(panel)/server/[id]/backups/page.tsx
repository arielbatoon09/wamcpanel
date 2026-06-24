import { ServerBackupsTab } from "@/components/features/servers/detail/server-backups-tab";

interface BackupsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Minecraft Server Panel - Backups",
  description: "Create, restore, or delete backups for the Minecraft server.",
};

export default async function BackupsPage({ params }: BackupsPageProps) {
  const { id } = await params;

  return (
    <div className="h-full w-full">
      <ServerBackupsTab id={id} />
    </div>
  );
}
