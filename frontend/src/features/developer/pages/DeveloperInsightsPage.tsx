import { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import ProjectStatsPanel from "../components/ProjectStatsPanel";
import ProjectWebhookDeliveriesPanel from "../components/ProjectWebhookDeliveriesPanel";

type ProjectFilter = "all" | string;
type InsightsView = "stats" | "webhook-log";

interface Props {
  token: string;
  view: InsightsView;
  enabled?: boolean;
}

export default function DeveloperInsightsPage({ token, view, enabled = true }: Props) {
  const { projects, isLoading, error } = useProjects(token, enabled);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");

  const selectedProjectId = projectFilter === "all" ? null : projectFilter;
  const showProjectColumn = projectFilter === "all";
  const projectsReady = !isLoading;

  return (
    <div className="space-y-5">
      <div className="min-w-0 max-w-sm">
        <label htmlFor="insights-project-filter" className="text-xs font-semibold text-muted">
          Project
        </label>
        <select
          id="insights-project-filter"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value as ProjectFilter)}
          disabled={isLoading || projects.length === 0}
          className="pagination-select mt-1.5 w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary/50"
        >
          <option value="all">Tất cả project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}

      {!isLoading && projects.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-hairline bg-fill-subtle px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Chưa có project nào</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            Tạo project trong khu vực nhà phát triển để xem{" "}
            {view === "stats" ? "thống kê" : "webhook log"}.
          </p>
        </section>
      ) : null}

      {projects.length > 0 && view === "stats" ? (
        <ProjectStatsPanel
          projectId={selectedProjectId}
          projects={projects}
          enabled={enabled}
          projectsReady={projectsReady}
          showProjectName={showProjectColumn}
        />
      ) : null}

      {projects.length > 0 && view === "webhook-log" ? (
        <ProjectWebhookDeliveriesPanel
          projectId={selectedProjectId}
          projects={projects}
          enabled={enabled}
          projectsReady={projectsReady}
          showProjectName={showProjectColumn}
        />
      ) : null}
    </div>
  );
}
