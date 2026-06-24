import { ServerControlsHeader } from "@/components/features/servers/detail/server-controls-header"
import { ServerDetailsManager } from "@/components/features/servers/detail/server-details-manager"

interface ServerPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Minecraft Server Panel - Console",
  description: "Live console logs and resource usage metrics for Minecraft server.",
}

export default async function ServerPage({ params }: ServerPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      
      {/* Control Actions Header */}
      <section aria-label="Server Controls">
        <ServerControlsHeader id={id} />
      </section>

      {/* Main Server Manager Section (Tabs: Console, Files, Plugins, etc.) */}
      <section aria-label="Server Manager">
        <ServerDetailsManager id={id} />
      </section>
      
    </div>
  )
}
