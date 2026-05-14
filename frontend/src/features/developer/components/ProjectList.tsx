import { ChevronRight, KeyRound } from "lucide-react";
import { ProjectListSkeleton } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { formatDate } from "../../../shared/lib/format";
import type { DeveloperProjectResponse } from "../types";

interface Props {
  projects: DeveloperProjectResponse[];
  isLoading: boolean;
  onSelect: (project: DeveloperProjectResponse) => void;
}

export default function ProjectList({ projects, isLoading, onSelect }: Props) {
  const showSkeleton = useStableLoading(isLoading, { hasData: projects.length > 0 });

  if (showSkeleton) {
    return <ProjectListSkeleton />;
  }
  if (projects.length === 0) {
    return <p className="mt-4 text-sm text-muted">Chưa có project nào.</p>;
  }
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => onSelect(project)}
          className="group rounded-xl border border-hairline bg-fill-subtle px-4 py-3 text-left transition-colors duration-150 hover:border-primary/40 hover:bg-fill-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold text-ink">{project.name}</p>
            <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
              {project.webhookUrl ? (
                <span className="rounded-full border border-sky-500/25 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                  WEBHOOK
                </span>
              ) : null}
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
          </div>
          <p className="mt-1 font-mono text-xs text-muted">{project.id}</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-muted">{formatDate(project.createdAt)}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              <KeyRound className="h-3 w-3" />
              API keys
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
