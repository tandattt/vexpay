interface AppShellProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
}

export default function AppShell({
  header,
  sidebar,
  title,
  subtitle,
  eyebrow,
  children,
}: AppShellProps) {
  return (
    <div className="bg-mesh min-h-screen">
      {header}
      <div className="flex min-h-[calc(100vh-65px)]">
        {sidebar}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                {eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
                  {title}
                </h1>
                {subtitle ? <p className="mt-1.5 max-w-xl text-sm text-muted">{subtitle}</p> : null}
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
