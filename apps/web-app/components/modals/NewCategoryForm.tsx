"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useTodoStore } from "@/stores/todo.store";
import { appToast } from "@/components/feedback/app-toast";

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
  const createCategory = useTodoStore((s) => s.createCategory);

  const form = useForm<NewCategoryValues>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
      preferredStartTime: "",
      preferredEndTime: "",
    },
  });

  const onSubmit = async (data: NewCategoryValues) => {
    try {
      await createCategory(
        data.name,
        data.preferredStartTime || undefined,
        data.preferredEndTime || undefined
      );

      appToast.success("Category created", {
        description: `"${data.name}" has been added.`,
      });
      form.reset();
      onSuccessAction();
    } catch (err: unknown) {
      console.error("Failed to create category:", err);
      appToast.error("Category creation failed", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FieldGroup className="space-y-4">
        {/* Name */}
        <Field className="space-y-1.5">
          <FieldLabel htmlFor="cat-name">Category Name</FieldLabel>
          <Input
            {...form.register("name")}
            id="cat-name"
            placeholder="e.g. Work, Personal, Learning"
            className="h-10 rounded-lg bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-pace-accent"
          />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>

        {/* Preferred time range */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <p className="mb-3 text-xs font-medium text-slate-300">
            Preferred Time Window{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </p>
          <p className="mb-3 text-[11px] text-slate-500">
            Set a preferred time window for tasks in this category. The AI
            scheduler will try to place tasks within this window.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="cat-start" className="text-[11px]">
                Start Time
              </FieldLabel>
              <Input
                {...form.register("preferredStartTime")}
                id="cat-start"
                type="time"
                className="h-9 rounded-lg border-slate-600 bg-slate-700/80 text-sm text-slate-300 focus:border-pace-accent scheme-dark"
              />
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel htmlFor="cat-end" className="text-[11px]">
                End Time
              </FieldLabel>
              <Input
                {...form.register("preferredEndTime")}
                id="cat-end"
                type="time"
                className="h-9 rounded-lg border-slate-600 bg-slate-700/80 text-sm text-slate-300 focus:border-pace-accent scheme-dark"
              />
            </Field>
          </div>
        </div>
      </FieldGroup>

      {/* Submit */}
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-10 w-full rounded-lg bg-pace-accent font-semibold text-slate-950 transition hover:brightness-110 active:scale-[0.98]"
      >
        {form.formState.isSubmitting ? "Creating..." : "Create Category"}
      </Button>
    </form>
  );
}
