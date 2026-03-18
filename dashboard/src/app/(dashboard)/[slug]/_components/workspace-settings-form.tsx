"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Copy, Check, Eye, EyeOff, RotateCw, Plus, X } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  url: z.string().url("Invalid URL"),
  slug: z.string().min(2),
  allowed_origins: z.array(z.string()),
});

export function WorkspaceSettingsForm({ workspace }: { workspace: any }) {
  const { updateWorkspace, switchToWorkspace } = useWorkspaces();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workspace.name,
      url: workspace.url,
      slug: workspace.slug,
      allowed_origins: workspace.allowed_origins || [],
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await updateWorkspace.mutateAsync({ slug: workspace.slug, data });
    if (data.slug !== workspace.slug) switchToWorkspace(data.slug);
    form.reset(data);
  };

  const addOrigin = () => {
    const val = newOrigin.trim();
    if (val && !form.getValues("allowed_origins").includes(val)) {
      form.setValue("allowed_origins", [...form.getValues("allowed_origins"), val], { shouldDirty: true });
      setNewOrigin("");
    }
  };

  return (
    <div className="max-w-4xl space-y-12">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your workspace identity and security.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Workspace Name</FieldLabel>
            <Input {...form.register("name")} placeholder="My Awesome Project" />
            <FieldError errors={[form.formState.errors.name]} />
          </div>

          <div className="space-y-2">
            <FieldLabel>Slug</FieldLabel>
            <Input {...form.register("slug")} className="font-mono text-sm" />
            <FieldError errors={[form.formState.errors.slug]} />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <FieldLabel>Production URL</FieldLabel>
            <Input {...form.register("url")} placeholder="https://myapp.com" />
            <FieldError errors={[form.formState.errors.url]} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <FieldLabel>Allowed Origins</FieldLabel>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="https://..."
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigin())}
              />
              <Button className="cursor-pointer" type="button" variant="secondary" onClick={addOrigin}>
                <Plus className="size-4 mr-2" /> Add
              </Button>
            </div>

            <Controller
              name="allowed_origins"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2 pt-1">
                  {field.value.map((origin) => (
                    <Badge key={origin} variant="outline" className="pl-3 pr-1 py-1.5 text-sm font-medium border-muted-foreground/20">
                      <span className="font-mono text-xs">{origin}</span>
                      <button
                        type="button"
                        onClick={() => field.onChange(field.value.filter(o => o !== origin))}
                        className="ml-2 p-1 hover:bg-muted rounded-full cursor-pointer transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-3 pt-4">
            <FieldLabel>API Key</FieldLabel>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={workspace.api_key}
                  type={showKey ? "text" : "password"}
                  className="font-mono pr-24 bg-muted/30"
                />
                <div className="absolute right-0 top-0 flex h-full items-center pr-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="size-8 hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(workspace.api_key);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="size-8 hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button" className="shrink-0 cursor-pointer">
                    <RotateCw className="size-4 mr-2 " /> Regenerate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All current integrations using this key will stop working immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateWorkspace.mutateAsync({ slug: workspace.slug, data: { regenerate_api_key: true } })}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!form.formState.isDirty || updateWorkspace.isPending}
            className="min-w-[140px] cursor-pointer"
          >
            {updateWorkspace.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}