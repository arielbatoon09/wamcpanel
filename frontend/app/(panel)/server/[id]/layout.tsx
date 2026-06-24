"use client";

import { ServerDetailsLayout } from "@/components/features/servers/detail/server-details-layout";

export default function ServerDetailLayout({ children }: { children: React.ReactNode }) {
  return <ServerDetailsLayout>{children}</ServerDetailsLayout>;
}
