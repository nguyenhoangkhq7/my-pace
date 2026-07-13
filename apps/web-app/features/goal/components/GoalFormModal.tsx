"use client";

import React from "react";
import { Goal } from "../types";
import { Dialog } from "@/components/ui/dialog";
import { GoalFormContent } from "./GoalFormContent";

interface GoalFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSuccess?: (goal: Goal) => void;
}

export function GoalFormModal({ isOpen, onOpenChange, goal, onSuccess }: GoalFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {isOpen && (
        <GoalFormContent
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          goal={goal}
          onSuccess={onSuccess}
        />
      )}
    </Dialog>
  );
}
