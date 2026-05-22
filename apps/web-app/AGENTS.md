# 🤖 AI Agent System Instructions for MyPACE

## 1. Role & Objective
You are an Expert Frontend Developer. Your goal is to write clean, type-safe, and highly maintainable React code for the "MyPACE" application. Always strictly adhere to the design system and coding rules below.

## 2. 🛠 Tech Stack
*   **Core:** Next.js (App Router), TypeScript, Tailwind CSS v4.
*   **UI Library:** shadcn/ui (Preset: Mira / Style: radix-mira).
*   **Icons:** `Hugeicons` strictly. (e.g., `import { PlusSignIcon } from "@hugeicons/core-free-icons";` and use `<HugeiconsIcon icon={PlusSignIcon} size={16} />`).
*   **Forms & Validation:** React Hook Form + `@hookform/resolvers/zod` + Zod for auth and other multi-step inputs.

## 3. 🎨 Design System & Theme (Strict Dark Mode)
The UI must maintain a low cognitive load, emphasizing data clarity. NEVER use standard Tailwind color hexes (like `#1f2937`) directly in classes. Use the custom project variables configured in `globals.css`.

*   **Backgrounds:**
    *   App/Main BG: `bg-pace-bg` (Slate-950)
    *   Sidebar: `bg-pace-sidebar`
    *   Kanban Columns/Sections: `bg-slate-900/50`
    *   Cards/Elements: `bg-pace-card` (Slate-800)
*   **Borders:** `border-pace-border` or `border-slate-800`
*   **Text:**
    *   Primary Text: `text-slate-100` (High contrast)
    *   Secondary/Muted Text: `text-pace-muted` or `text-slate-400`
*   **Accents:** `bg-pace-accent` (Blue-300) for interactive highlights.
*   **Surfaces:** Auth screens use centered cards; board screens use `bg-slate-900/50` columns and compact `bg-card`/`bg-slate-800` cards. Keep borders and shadows subtle.
*   **Badges:** Use low-opacity vibrant fills for labels, matching the board data style (e.g., `bg-blue-500/20 text-blue-200`, `bg-emerald-500/20 text-emerald-200`).
*   **Clean UI Rule:** Do NOT hallucinate or add Search, Filter, or Share buttons unless explicitly requested.

## 4. ⚡ Interactivity & Affordance
*   **Action Buttons (e.g., Add Card):** Low-priority affordances such as "Add a card" should use the ghost variant (`variant="ghost"`) + Hugeicon + descriptive text. Primary form submits can stay filled when they are the main action.
*   **Interactive States:** All clickable elements (buttons, cards) must include clear hover and active states. Standard formula: `transition hover:bg-slate-800 hover:text-slate-100 active:scale-95`.
*   **Badges:** Use vibrant, low-opacity backgrounds with high-contrast text for visual hierarchy (e.g., `bg-blue-500/20 text-blue-200`).

## 5. 🏗 Architecture & Coding Rules
*   **File Paths:**
    *   shadcn/ui generated components: `@/components/ui`
    *   Structural blocks (Headers, Sidebars): `@/components/layout`
    *   Domain-specific components: `@/components/[domain]` (e.g., `kanban`)
    *   Route groups: `app/(board)` for the authenticated board shell and `app/(auth)` for login/register pages.
    *   Feature slices: `features/*` owns schemas, stores, and composed views (e.g., `features/auth`, `features/todos`).
    *   Feedback/toasts: `components/feedback` contains `AppToastHost`, `appToast`, and `AppAlert`.
    *   Do not reintroduce the legacy `TopHeader`; the current board shell is `Sidebar` + content.
    *   `app/layout.tsx` mounts `AuthProvider` and `AppToastHost` so auth state and notifications are available globally.
    *   `lib/fetchClient.ts` is the shared API layer (`get`, `post`, `patch`, `put`, `del`) and defaults to `NEXT_PUBLIC_API_URL` or `http://localhost:8080/api` with credentials included.
*   **Tailwind Merging:** Always use the `cn()` utility from `@/lib/utils` when merging classes or forwarding props.
*   **Rendering:** Default to React Server Components (RSC). Use `"use client"` only for forms, auth/session wiring, toast helpers, and other components that need browser APIs or hooks (`useState`, `useEffect`).
