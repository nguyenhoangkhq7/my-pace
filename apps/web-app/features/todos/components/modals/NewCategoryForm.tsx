"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "../../hooks/useCategories";

// ── Schema ──────────────────────────────────────────────────────────────────

const newCategorySchema = z.object({
  name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be under 100 characters"),
  preferredStartTime: z.string().optional(),
  preferredEndTime: z.string().optional(),
});

type NewCategoryValues = z.infer<typeof newCategorySchema>;

// ── Component ───────────────────────────────────────────────────────────────

type NewCategoryFormProps = {
  onSuccessAction: () => void;
};

export function NewCategoryForm({ onSuccessAction }: NewCategoryFormProps) {
  const { createCategory } = useCategories();

  const form = useForm<NewCategoryValues>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
      preferredStartTime: "",
      preferredEndTime: "",
    },
  });

  // Theo dõi giá trị để hiển thị nút Clear hợp lý
  const startTime = useWatch({ control: form.control, name: "preferredStartTime" });
  const endTime = useWatch({ control: form.control, name: "preferredEndTime" });

  const onSubmit = async (data: NewCategoryValues) => {
    const created = await createCategory(
        data.name,
        data.preferredStartTime || undefined,
        data.preferredEndTime || undefined,
    );

    if (created) {
      form.reset();
      onSuccessAction();
    }
  };

  return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Category Name Input */}
        <div className="space-y-1">
          <Input
              {...form.register("name")}
              placeholder="Category name (e.g. Work, Personal)..."
              className="h-auto border-none bg-transparent px-0 py-0 text-xl font-semibold tracking-tight text-pace-text placeholder:text-pace-muted-soft shadow-none focus-visible:ring-0"
          />
          {form.formState.errors.name?.message && (
              <p className="text-[11px] text-red-400 font-medium">{form.formState.errors.name.message}</p>
          )}
        </div>

        <hr className="border-pace-border" />

        {/* Preferred Time Box */}
        <div className="rounded-xl border border-pace-border bg-pace-bg/50 p-3.5 space-y-3">
          <div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">
                Preferred Time Window <span className="font-normal text-pace-muted-soft">(optional)</span>
              </p>
              {(startTime || endTime) && (
                  <button
                      type="button"
                      onClick={() => {
                        form.setValue("preferredStartTime", "");
                        form.setValue("preferredEndTime", "");
                      }}
                      className="text-[10px] text-pace-accent hover:underline"
                  >
                    Clear Window
                  </button>
              )}
            </div>
            <p className="text-[11px] text-pace-muted-soft mt-0.5 leading-normal">
              The AI scheduler will prioritize placing tasks of this category within this specific time frame.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div className="space-y-1">
              <label htmlFor="cat-start" className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">
                Start Time
              </label>
              <Input
                  {...form.register("preferredStartTime")}
                  id="cat-start"
                  type="time"
                  className="h-9 rounded-lg border-pace-border bg-pace-bg px-2 text-xs text-pace-text focus-visible:ring-0 focus:border-pace-accent scheme-dark"
              />
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <label htmlFor="cat-end" className="text-[10px] font-bold uppercase tracking-wider text-pace-muted">
                End Time
              </label>
              <Input
                  {...form.register("preferredEndTime")}
                  id="cat-end"
                  type="time"
                  className="h-9 rounded-lg border-pace-border bg-pace-bg px-2 text-xs text-pace-text focus-visible:ring-0 focus:border-pace-accent scheme-dark"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-9 w-full rounded-lg bg-pace-accent font-semibold text-slate-950 hover:brightness-110 active:scale-[0.98] text-xs transition-all"
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Category"}
        </Button>
      </form>
  );
}