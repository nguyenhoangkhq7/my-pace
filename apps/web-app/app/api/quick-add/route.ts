import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface QuickAddRequestBody {
  text: string;
  categories: { id: string; name: string }[];
  goals: { id: string; title: string }[];
  currentDateTime: string;
  dayOfWeek: string;
  timezone: string;
}

/**
 * ─────────────────────────────────────────────────────────────────
 *  STATIC SYSTEM PROMPT (~850 tokens)
 *  Module-level constant → Groq prefix cache hits on EVERY request.
 *  ⚠️  Do NOT inject any dynamic values here.
 * ─────────────────────────────────────────────────────────────────
 */
const STATIC_SYSTEM_PROMPT = `You are an expert task and calendar event extraction engine for a Vietnamese productivity app.
Your job: parse a user's free-form note (Vietnamese or English) and output structured JSON data for EITHER a task or a calendar event.

━━━ OUTPUT FORMAT ━━━
Respond ONLY with a single JSON object. No markdown, no explanation.
{
  "type": "task" | "event",
  "title": string,
  "estimatedMinutes": number | null,
  "isUrgent": boolean,
  "isImportant": boolean,
  "dueDate": "YYYY-MM-DDTHH:mm:ss" | null,
  "eventDate": "YYYY-MM-DD" | null,
  "startTime": "HH:mm" | null,
  "endTime": "HH:mm" | null,
  "categoryId": string | null,
  "goalId": string | null,
  "notes": string | null,
  "checklists": [{"title": string, "isCompleted": false, "orderIndex": number}] | null
}

━━━ TYPE DISCRIMINATION RULES ━━━
- "event" if the input specifies a SPECIFIC CLOCK TIME / HOUR (e.g., "7h", "19:00", "8h30", "at 3pm", "lúc 9h") for a meeting, appointment, outing, exercise, or activity happening at a specific scheduled time.
  Examples of events:
  • "tối nay 7h đi công viên tập thể dục" → event (startTime="19:00", eventDate=today, title="Tập thể dục", notes="Công viên")
  • "họp team lúc 3h chiều" → event (startTime="15:00", eventDate=today, title="Họp team")
  • "ăn tối 7h tại nhà hàng" → event (startTime="19:00", eventDate=today, title="Ăn tối")
  • "phỏng vấn 10h sáng thứ 3" → event (startTime="10:00", eventDate=Tuesday)

- "task" for flexible work items, to-dos, deliverables, errands, or habits WITHOUT a specific scheduled clock hour:
  • "nộp báo cáo trước thứ 6" → task (has deadline, no fixed meeting slot)
  • "tập gym sáng mai" → task (general habit without exact hour)
  • "đọc sách 30 phút" → task
  • "đi siêu thị mua trứng" → task

- Rule of thumb: Specific clock hour (e.g. 7h, 19:00, lúc 3h) = "event". Flexible deadline or general time-of-day = "task".

━━━ FIELD RULES ━━━

[title]
- Extract the CORE action verb + object. Drop time/urgency/modifier words.
- Capitalize first letter. Preserve user's language (Vi/En).
- Examples: "họp team gấp sáng mai" → "Họp team" | "nộp báo cáo trước 5h" → "Nộp báo cáo"

[estimatedMinutes] — infer if not explicit (for tasks)
- Explicit: "30 phút"=30, "1 tiếng"=60, "2h"=120, "1.5h"=90, "nửa tiếng"=30
- Implicit defaults: họp/meeting=60, phim/movie=120, đọc sách=30, gym=60, nấu ăn=45, đi chợ=30, cà phê=60, học/study=45, báo cáo=90, email=15, chạy bộ=30, phỏng vấn=60

[isUrgent & isImportant] — (For TASKS)
- Urgent: deadline within 48h OR keywords: gấp, khẩn, urgent, ASAP, ngay lập tức, hạn chót, deadline, trễ rồi, chạy deadline, phải xong hôm nay.
- Important: Health, Finance, Work Deliverables, Education, Planning are ALWAYS true. Casual social/entertainment ALWAYS false.

[dueDate] — (For TASKS) parse from CONTEXT block below
- Format: "YYYY-MM-DDTHH:mm:ss". Date only → 23:59. null if no date reference or if type is "event".

[eventDate, startTime, endTime] — (For EVENTS ONLY)
- eventDate: "YYYY-MM-DD" (from date reference or today)
- startTime: "HH:mm" (24h format, e.g. "09:00", "15:00", "19:00")
- endTime: startTime + estimatedMinutes (default 60 minutes if unspecified, e.g. 15:00 → 16:00).
- If type is "task" → eventDate, startTime, endTime MUST all be null.

[categoryId] — MUST attempt semantic match against categories in CONTEXT block. >60% confidence → use id.
[goalId] — >80% confidence task directly contributes to goal → use id. Otherwise null.
[notes] — location, room, links, attendees, conditions not in title. null if none.
[checklists] — extract sub-items: "mua: A,B,C" | "- item". null if none.`;

/**
 * Dynamic context block — injected at END of system prompt.
 * Only this part changes per request → static prefix above is always cached.
 */
function buildDynamicContext(body: QuickAddRequestBody): string {
  const today = body.currentDateTime.split("T")[0];
  const todayDate = new Date(body.currentDateTime);

  const addDays = (n: number) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };

  const dow = todayDate.getDay();
  const daysUntil = (t: number) => ((t - dow + 7) % 7) || 7;

  const cats = body.categories.length
    ? body.categories.map((c) => `  ${c.name} → id="${c.id}"`).join("\n")
    : "  (none)";

  const goals = body.goals.length
    ? body.goals.map((g) => `  ${g.title} → id="${g.id}"`).join("\n")
    : "  (none)";

  return `
━━━ CONTEXT (dynamic) ━━━
Now: ${body.dayOfWeek} ${body.currentDateTime} (${body.timezone})
Dates:
  today=${today} tomorrow=${addDays(1)} day_after=${addDays(2)}
  Mon=${addDays(daysUntil(1))} Tue=${addDays(daysUntil(2))} Wed=${addDays(daysUntil(3))}
  Thu=${addDays(daysUntil(4))} Fri=${addDays(daysUntil(5))} Sat=${addDays(daysUntil(6))} Sun=${addDays(daysUntil(0))}
  next_week=${addDays(7)} next_month=${addDays(30)} end_of_month=${addDays(30 - todayDate.getDate())}
  this_week_end=${addDays(daysUntil(5))} (Friday)

Categories:
${cats}

Goals (active):
${goals}`;
}

function buildSystemPrompt(body: QuickAddRequestBody): string {
  return STATIC_SYSTEM_PROMPT + buildDynamicContext(body);
}

/**
 * ─────────────────────────────────────────────
 *  FEW-SHOT EXAMPLES — dynamic, uses real category IDs
 * ─────────────────────────────────────────────
 */

// Semantic keyword map: category name patterns → activity keywords
const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  work:     ["công việc", "work", "office", "làm việc", "nghề"],
  health:   ["sức khỏe", "health", "fitness", "thể dục", "y tế"],
  study:    ["học tập", "study", "education", "học", "đào tạo"],
  personal: ["cá nhân", "personal", "life", "gia đình", "family"],
  finance:  ["tài chính", "finance", "money", "tiền"],
  project:  ["dự án", "project", "dev", "code", "thiết kế", "design"],
};

type CategoryDomain = "work" | "health" | "study" | "personal" | "finance" | "project" | null;

// Find a real user category that matches a semantic domain
function findCategoryByDomain(
  categories: { id: string; name: string }[],
  domain: CategoryDomain
): { id: string; name: string } | null {
  if (!domain || !categories.length) return null;
  const keywords = CATEGORY_KEYWORD_MAP[domain] ?? [];
  return (
    categories.find((c) =>
      keywords.some((kw) => c.name.toLowerCase().includes(kw))
    ) ?? null
  );
}

function buildFewShotMessages(body: QuickAddRequestBody) {
  const today = body.currentDateTime.split("T")[0];
  const todayDate = new Date(body.currentDateTime);
  const addDays = (n: number) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };
  const dow = todayDate.getDay();
  const daysUntil = (t: number) => ((t - dow + 7) % 7) || 7;
  const friday = addDays(daysUntil(5));
  const tomorrow = addDays(1);

  // Dynamically resolve real category IDs for demo examples
  const workCat    = findCategoryByDomain(body.categories, "work");
  const healthCat  = findCategoryByDomain(body.categories, "health");
  const studyCat   = findCategoryByDomain(body.categories, "study");
  const personalCat = findCategoryByDomain(body.categories, "personal");

  return [
    // ── Case 1: EVENT — Meeting with explicit time ──────────
    {
      role: "user" as const,
      content: "họp team design review chiều mai lúc 3h tại phòng họp B2",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "event",
        title: "Họp team design review",
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: false,
        dueDate: null,
        eventDate: tomorrow,
        startTime: "15:00",
        endTime: "16:00",
        categoryId: workCat?.id ?? null,
        goalId: null,
        notes: "Phòng họp B2",
        checklists: null,
      }),
    },
    // ── Case 2: TASK — Urgent deliverable ────────────────────
    {
      role: "user" as const,
      content: "nộp báo cáo quý trước thứ 6 gấp, mất khoảng 2 tiếng",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "task",
        title: "Nộp báo cáo quý",
        estimatedMinutes: 120,
        isUrgent: true,
        isImportant: true,
        dueDate: `${friday}T23:59:00`,
        eventDate: null,
        startTime: null,
        endTime: null,
        categoryId: workCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Case 3: EVENT — Interview with morning time ──────────
    {
      role: "user" as const,
      content: "phỏng vấn ứng viên lúc 10h sáng thứ 3",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "event",
        title: "Phỏng vấn ứng viên",
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: false,
        dueDate: null,
        eventDate: addDays(daysUntil(2)),
        startTime: "10:00",
        endTime: "11:00",
        categoryId: workCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Case 3b: EVENT — Scheduled evening exercise / activity ─────
    {
      role: "user" as const,
      content: "tối nay 7h đi công viên tập thể dục",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "event",
        title: "Tập thể dục",
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: false,
        dueDate: null,
        eventDate: today,
        startTime: "19:00",
        endTime: "20:00",
        categoryId: healthCat?.id ?? null,
        goalId: null,
        notes: "Công viên",
        checklists: null,
      }),
    },
    // ── Case 4: TASK — Habit / Gym (Q2 task) ────────────────
    {
      role: "user" as const,
      content: "tập gym 1 tiếng sáng mai",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "task",
        title: "Tập gym",
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: true,
        dueDate: `${tomorrow}T08:00:00`,
        eventDate: null,
        startTime: null,
        endTime: null,
        categoryId: healthCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Case 5: TASK — Shopping with checklist ───────────────
    {
      role: "user" as const,
      content: "đi siêu thị mua: trứng, sữa tươi, bánh mì, rau cải",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        type: "task",
        title: "Đi siêu thị",
        estimatedMinutes: 30,
        isUrgent: false,
        isImportant: false,
        dueDate: null,
        eventDate: null,
        startTime: null,
        endTime: null,
        categoryId: personalCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: [
          { title: "Mua trứng", isCompleted: false, orderIndex: 0 },
          { title: "Mua sữa tươi", isCompleted: false, orderIndex: 1 },
          { title: "Mua bánh mì", isCompleted: false, orderIndex: 2 },
          { title: "Mua rau cải", isCompleted: false, orderIndex: 3 },
        ],
      }),
    },
  ];
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const body: QuickAddRequestBody = await request.json();

    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(body);
    const fewShot = buildFewShotMessages(body);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...fewShot,
          { role: "user", content: body.text },
        ],
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Groq API error:", response.status, errorData);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);

    if (!parsed.title || typeof parsed.title !== "string") {
      return NextResponse.json(
        { error: "AI failed to extract task title" },
        { status: 422 }
      );
    }

    // Normalize & sanitize output
    const extractedType = parsed.type === "event" ? "event" : "task";

    const result = {
      type: extractedType,
      title: parsed.title,
      estimatedMinutes:
        typeof parsed.estimatedMinutes === "number" && parsed.estimatedMinutes > 0
          ? parsed.estimatedMinutes
          : null,
      isUrgent: !!parsed.isUrgent,
      isImportant: !!parsed.isImportant,
      dueDate: typeof parsed.dueDate === "string" && parsed.dueDate.length > 0
        ? parsed.dueDate
        : null,
      eventDate: typeof parsed.eventDate === "string" && parsed.eventDate.length > 0
        ? parsed.eventDate
        : null,
      startTime: typeof parsed.startTime === "string" && parsed.startTime.length > 0
        ? parsed.startTime
        : null,
      endTime: typeof parsed.endTime === "string" && parsed.endTime.length > 0
        ? parsed.endTime
        : null,
      categoryId:
        typeof parsed.categoryId === "string" && parsed.categoryId.length > 0
          ? parsed.categoryId
          : null,
      goalId:
        typeof parsed.goalId === "string" && parsed.goalId.length > 0
          ? parsed.goalId
          : null,
      notes:
        typeof parsed.notes === "string" && parsed.notes.length > 0
          ? parsed.notes
          : null,
      checklists: Array.isArray(parsed.checklists) && parsed.checklists.length > 0
        ? parsed.checklists.map(
            (c: { title?: string; isCompleted?: boolean }, i: number) => ({
              title: c.title || "",
              isCompleted: !!c.isCompleted,
              orderIndex: i,
            })
          )
        : null,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Quick Add API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

