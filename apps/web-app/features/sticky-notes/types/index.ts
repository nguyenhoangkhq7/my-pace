export type StickyNoteColor = "amber" | "emerald" | "indigo" | "rose" | "violet" | "dark";

export interface StickyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: StickyNoteColor;
  isPinned: boolean;
  isMinimized: boolean;
  isVisible: boolean;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateStickyNotePayload = Partial<Omit<StickyNote, "id" | "userId" | "createdAt" | "updatedAt">>;
export type UpdateStickyNotePayload = Partial<Omit<StickyNote, "id" | "userId" | "createdAt" | "updatedAt">>;
