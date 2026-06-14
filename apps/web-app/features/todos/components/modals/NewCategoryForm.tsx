"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        {/* Name — prominent input */}
        <div className="px-5 pt-5 pb-4">
          <Input
              {...form.register("name")}
              autoFocus
              placeholder="Category name..."
              className={cn(
                  "h-auto border-none bg-transparent",
                  "px-0 py-0",
                  "text-lg font-semibold tracking-tight",
                  "text-foreground",
                  "placeholder:text-muted-foreground/50",
                  "shadow-none",
                  "focus-visible:ring-0",
              )}
          />
          {form.formState.errors.name?.message && (
              <p className="mt-1.5 text-[11px] font-medium text-red-400">
                {form.formState.errors.name.message}
              </p>
          )}
        </div>

        {/* Time window */}
        <div className="border-t border-border px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Preferred Time Window
            </p>
            {(startTime || endTime) && (
                <button
                    type="button"
                    onClick={() => {
                      form.setValue("preferredStartTime", "");
                      form.setValue("preferredEndTime", "");
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition"
                >
                  Clear
                </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-normal">
            AI scheduler will prioritize this time frame for tasks in this category.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="cat-start" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Start
              </label>
              <Input
                  {...form.register("preferredStartTime")}
                  id="cat-start"
                  type="time"
                  className="h-8 rounded-lg border-border bg-transparent px-2.5 text-xs text-foreground focus-visible:ring-0 focus:border-primary scheme-dark"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="cat-end" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                End
              </label>
              <Input
                  {...form.register("preferredEndTime")}
                  id="cat-end"
                  type="time"
                  className="h-8 rounded-lg border-border bg-transparent px-2.5 text-xs text-foreground focus-visible:ring-0 focus:border-primary scheme-dark"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-9 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500 active:scale-[0.98] text-xs transition-all disabled:opacity-40"
          >
            {form.formState.isSubmitting ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </form>
  );
}