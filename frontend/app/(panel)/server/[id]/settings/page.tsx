import { ServerSettingsTab } from "@/components/features/servers/detail/server-settings-tab"

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Minecraft Server Panel - Settings",
  description: "Configure settings and server.properties for the Minecraft server.",
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params

  return (
    <div className="w-full h-full">
      <ServerSettingsTab id={id} />
    </div>
  )
}
