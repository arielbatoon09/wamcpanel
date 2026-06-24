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
    <div className="w-full h-full">
      <ServerDetailsManager id={id} />
    </div>
  )
}
