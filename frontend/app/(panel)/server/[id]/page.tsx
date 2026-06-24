import { ServerOverviewTab } from "@/components/features/servers/detail/server-overview-tab"

interface ServerPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Minecraft Server Panel - Overview",
  description: "Resource usage statistics and overview metrics for Minecraft server.",
}

export default async function ServerPage({ params }: ServerPageProps) {
  const { id } = await params

  return (
    <div className="w-full h-full">
      <ServerOverviewTab id={id} />
    </div>
  )
}
