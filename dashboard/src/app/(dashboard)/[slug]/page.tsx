"use client";

import { useParams } from "next/navigation";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { WorkspaceSettingsForm } from "./_components/workspace-settings-form";
import { DangerZone } from "./_components/danger-zone";

export default function WorkspaceSettingsPage() {
  const { workspaces, isLoading } = useWorkspaces();
  const params = useParams();
  const workspace = workspaces.find((w) => w.slug === params.slug);

  if (isLoading || !workspace) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <WorkspaceSettingsForm workspace={workspace} />
      <DangerZone slug={workspace.slug} />
    </div>
  );
}