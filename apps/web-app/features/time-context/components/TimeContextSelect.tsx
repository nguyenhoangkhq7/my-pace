import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useTimeContexts } from "../hooks/useTimeContexts";
import { TimeContextFormModal } from "./TimeContextFormModal";
import type { TimeContextSlot } from "../types";

interface TimeContextSelectProps {
  value?: string | null;
  onChange: (timeContextId: string | null) => void;
}

export function TimeContextSelect({ value, onChange }: TimeContextSelectProps) {
  const { t } = useTranslation();
  const { timeContexts, createTimeContext } = useTimeContexts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setIsModalOpen(true);
    } else {
      onChange(val ? val : null);
    }
  };

  const handleCreateNew = async (data: { name: string; slots: TimeContextSlot[]; categoryIds: string[] }) => {
    const created = await createTimeContext(data);
    if (created?.id) {
      onChange(created.id);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase">{t.timeContext.preferredTimeContext}</label>
        <select
          value={value || ""}
          onChange={handleSelectChange}
          className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="">{t.timeContext.noContextDefault}</option>
          {timeContexts.map((ctx) => (
            <option key={ctx.id} value={ctx.id}>
              ⏰ {ctx.name} ({ctx.slots.length} slots)
            </option>
          ))}
          <option value="__new__">{t.timeContext.createNewContextOption}</option>
        </select>
      </div>

      <TimeContextFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateNew}
      />
    </>
  );
}
