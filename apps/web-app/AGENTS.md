🛠 Tech Stack
Core: Next.js (App Router), TS, Tailwind v4.

UI: shadcn/ui (Preset: Mira / Style: radix-mira).

Icons: Hugeicons only (e.g., <PlusSignIcon size="{16}"/>).

🎨 Design System (Low Cognitive Load)
Theme: Strict Dark Mode.

Colors (Override Neutral):

App BG: Slate-950 (#0b0e11).

Columns: Slate-900/50 + border Slate-800.

Cards: Slate-800, text Slate-100 (High contrast).

Clean UI: Remove Search, Filter, Share.

⚡ Interactivity & Affordance
Add Card Button: Must use ghost variant + Plus icon + "Add a card" text.

States: Clear :hover (brighten) & :active (scale-95) for all clickable elements.

Badges: Use vibrant colors (Blue/Amber/Green) for visual hierarchy.

🏗 Coding Rules
Path: UI in @/components/ui, Layout in @/components/layout.

Utility: Always use cn() for Tailwind merging.

Logic: Server Components by default; 'use client' only for interactivity.