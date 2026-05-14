import { UserCircle2 } from "lucide-react";
import type { UserInfo } from "../../../shared/types";
import BecomeDeveloperPanel from "../components/BecomeDeveloperPanel";
import DeveloperWorkspace from "../components/DeveloperWorkspace";
import { DeveloperRequestSkeleton } from "../../../shared/components/ui";
import { useStableLoading } from "../../../shared/hooks/useStableLoading";
import { useDeveloperRequest } from "../hooks/useDeveloperRequest";
import { useProjects } from "../hooks/useProjects";

interface Props {
  user: UserInfo;
  token: string | null;
  enabled: boolean;
  viewMode: "customer" | "developer";
}

export default function DeveloperPage({ user, token, enabled, viewMode }: Props) {
  const request = useDeveloperRequest(token, enabled);
  const isDeveloper = request.status?.isDeveloper || user.roles.includes("DEVELOPER");
  const projects = useProjects(token, enabled && isDeveloper && viewMode === "developer");
  const showRequestSkeleton = useStableLoading(request.isLoading, {
    hasData: request.status !== null,
  });

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-on-primary shadow-soft">
          <span className="text-sm font-bold">{"</>"}</span>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">
            {viewMode === "developer" ? "Khu vực nhà phát triển" : "Nhà phát triển"}
          </h3>
          <p className="text-xs text-muted">
            {viewMode === "developer"
              ? "API integrations & project management"
              : "Yêu cầu và theo dõi quyền nhà phát triển"}
          </p>
        </div>
      </div>

      {showRequestSkeleton ? (
        <DeveloperRequestSkeleton />
      ) : request.error ? (
        <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">{request.error}</p>
      ) : viewMode === "customer" && isDeveloper ? (
        <DeveloperRoleHint />
      ) : viewMode === "developer" && isDeveloper ? (
        <DeveloperWorkspace
          projects={projects.projects}
          isLoading={projects.isLoading}
          isCreating={projects.isCreating}
          error={projects.error}
          onCreate={projects.create}
          onProjectUpdated={projects.updateProject}
        />
      ) : (
        <BecomeDeveloperPanel
          status={request.status}
          isSubmitting={request.isSubmitting}
          error={request.error}
          onSubmit={() => void request.submit()}
        />
      )}
    </section>
  );
}

function DeveloperRoleHint() {
  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <UserCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-2 text-sm leading-relaxed text-muted">
          <p className="font-medium text-ink">Bạn đã là nhà phát triển.</p>
          <p>
            Nhấn vào avatar góc trên bên phải để chuyển sang{" "}
            <span className="font-semibold text-ink">khu vực phát triển</span> — nơi quản lý project,
            API key, webhook và tài liệu API.
          </p>
        </div>
      </div>
    </div>
  );
}
