import { ServerConsoleSection } from "@/components/features/servers/detail/server-console-section"

interface ConsolePageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Minecraft Server Panel - Console",
  description: "Live console logs for Minecraft server.",
}

export default async function ConsolePage({ params }: ConsolePageProps) {
  const { id } = await params

  return (
    <div className="animate-in fade-in duration-300 lg:h-full h-[450px]">
      <ServerConsoleSection id={id} />
    </div>
  )
}
