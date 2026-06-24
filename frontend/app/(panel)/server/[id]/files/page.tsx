import { ServerFilesTab } from "@/components/features/servers/detail/server-files-tab";

interface FilesPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Minecraft Server Panel - File Manager",
  description: "Manage Minecraft server files and directories.",
};

export default async function FilesPage({ params }: FilesPageProps) {
  const { id } = await params;

  return (
    <div className="h-full w-full">
      <ServerFilesTab id={id} />
    </div>
  );
}
