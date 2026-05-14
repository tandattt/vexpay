import { useState } from "react";
import { Plus } from "lucide-react";
import CreateProjectModal from "./CreateProjectModal";
import ProjectApiKeysModal from "./ProjectApiKeysModal";
import ProjectList from "./ProjectList";
import type { DeveloperProjectResponse } from "../types";

interface Props {
  projects: DeveloperProjectResponse[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  onCreate: (name: string) => Promise<boolean>;
  onProjectUpdated: (project: DeveloperProjectResponse) => void;
}

export default function DeveloperWorkspace({
  projects,
  isLoading,
  isCreating,
  error,
  onCreate,
  onProjectUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DeveloperProjectResponse | null>(null);

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-xl border border-hairline bg-fill-subtle p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-base font-semibold text-ink">Projects</h4>
            <p className="mt-0.5 text-xs text-muted">Managing your available API integrations</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-primary px-3 text-xs font-semibold text-on-primary shadow-soft transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create New Project
          </button>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}

        <CreateProjectModal
          open={open}
          isCreating={isCreating}
          onClose={() => setOpen(false)}
          onSubmit={onCreate}
        />

        <ProjectApiKeysModal
          project={selected}
          onClose={() => setSelected(null)}
          onProjectUpdated={(updated) => {
            onProjectUpdated(updated);
            setSelected(updated);
          }}
        />

        <div className="mt-4 rounded-xl border border-hairline bg-fill-subtle p-4">
          <h5 className="text-sm font-semibold text-ink">Your Projects</h5>
          <p className="mt-1 text-xs text-muted">Chọn dự án để quản lý webhook và API keys.</p>
          <ProjectList projects={projects} isLoading={isLoading} onSelect={setSelected} />
        </div>
      </section>
    </div>
  );
}
