import { FocusSession } from "@/components/layout/FocusSession";

const navItems = [
  { label: "Boards", active: true },
  { label: "Calendar", active: false },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/5 bg-pace-sidebar px-6 py-6">
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
      <div className="mt-auto">
        <FocusSession />
      </div>
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
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition " +
        (active
          ? "bg-white/5 text-slate-100"
          : "text-[var(--pace-muted)] hover:text-slate-200")
      }
    >
      <span
        className={
          "h-4 w-4 rounded-md border " +
          (active
            ? "border-[#7aa6ff] bg-[#7aa6ff]/15"
            : "border-white/10")
        }
      />
      {label}
    </button>
  );
}

