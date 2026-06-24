import { ServerActivityLogTab } from "@/components/features/servers/detail/server-activity-log-tab";

interface ActivityPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Minecraft Server Panel - Activity Logs",
  description: "Activity and audit log for the Minecraft server.",
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;

  return (
    <div className="h-auto animate-in duration-300 fade-in lg:h-full">
      <ServerActivityLogTab id={id} />
    </div>
  );
}
