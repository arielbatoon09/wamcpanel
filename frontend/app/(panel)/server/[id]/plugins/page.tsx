import { ServerPluginsTab } from "@/components/features/servers/detail/server-plugins-tab";

interface PluginsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Minecraft Server Panel - Plugins",
  description: "View, enable, or delete plugins for the Minecraft server.",
};

export default async function PluginsPage({ params }: PluginsPageProps) {
  const { id } = await params;

  return (
    <div className="h-full w-full">
      <ServerPluginsTab id={id} />
    </div>
  );
}
