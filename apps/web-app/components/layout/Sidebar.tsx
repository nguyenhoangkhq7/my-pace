const navItems = [
  { label: "Boards", active: true },
  { label: "Calendar", active: false },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-pace-sidebar px-6 py-6">
      <div className="text-2xl font-semibold tracking-wide text-slate-100">
        MyPACE
      </div>
      <nav className="mt-10 flex flex-col gap-2">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            label={item.label}
            active={item.active}
          />
        ))}
      </nav>
    </aside>
  );
}

type SidebarNavItemProps = {
  label: string;
  active?: boolean;
};

function SidebarNavItem({ label, active }: SidebarNavItemProps) {
  return (
    <button
      className={
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-800/60 active:scale-95 " +
        (active
          ? "bg-slate-800/70 text-slate-100"
          : "text-[var(--pace-muted)] hover:text-slate-100")
      }
    >
      <span
        className={
          "h-4 w-4 rounded-md border " +
          (active
            ? "border-blue-400/80 bg-blue-400/15"
            : "border-slate-700")
        }
      />
      {label}
    </button>
  );
}

