import { ServerPlayersTab } from "@/components/features/servers/detail/server-players-tab";

interface PlayersPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Minecraft Server Panel - Players",
  description: "View and manage active players on the Minecraft server.",
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { id } = await params;

  return (
    <div className="h-full w-full">
      <ServerPlayersTab id={id} />
    </div>
  );
}
