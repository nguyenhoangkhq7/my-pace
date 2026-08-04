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
const STATIC_SYSTEM_PROMPT = `You are an expert task extraction engine for a Vietnamese productivity app.
Your job: parse a user's free-form note (Vietnamese or English) and output structured task data as JSON.

━━━ OUTPUT FORMAT ━━━
Respond ONLY with a single JSON object. No markdown, no explanation.
{"title":string,"estimatedMinutes":number|null,"isUrgent":boolean,"isImportant":boolean,"dueDate":"YYYY-MM-DDTHH:mm:ss"|null,"categoryId":string|null,"goalId":string|null,"notes":string|null,"checklists":[{"title":string,"isCompleted":false,"orderIndex":number}]|null}

━━━ FIELD RULES ━━━

[title]
- Extract the CORE action verb + object. Drop time/urgency/modifier words.
- Capitalize first letter. Preserve user's language (Vi/En).
- Examples: "họp team gấp sáng mai" → "Họp team" | "urgent call with client tomorrow" → "Call with client"
- Shopping list with no verb → "Mua sắm" (or "Shopping").

[estimatedMinutes] — infer if not explicit
- Explicit: "30 phút"=30, "1 tiếng"=60, "2h"=120, "1.5h"=90, "nửa tiếng"=30
- Implicit defaults:
    họp/meeting/call=60  phim/movie=120  đọc sách/reading=30  gym/workout=60
    nấu ăn/cooking=45   đi chợ/grocery=30  cà phê/coffee=60  học/study=45
    viết báo cáo/report=90  email/reply=15  chạy bộ/run=30  yoga/thiền=30
    phỏng vấn/interview=60  ăn tối/dinner=60  ăn trưa/lunch=45
- Truly unknowable → null.

━━━ EISENHOWER MATRIX ━━━
Q1: Urgent=true,  Important=true  → Crises, real deadlines, critical work
Q2: Urgent=false, Important=true  → Health, learning, planning (most valuable!)
Q3: Urgent=true,  Important=false → Interruptions, routine meetings
Q4: Urgent=false, Important=false → Entertainment, trivial errands

[isUrgent] — TIME PRESSURE only, not importance
- true if: deadline within 48h (today/tomorrow) OR urgency keywords:
  gấp, khẩn, urgent, ASAP, ngay lập tức, hạn chót, deadline, trễ rồi, chạy deadline,
  còn X tiếng/phút nữa, phải xong hôm nay, trước X giờ hôm nay
- ⚠️ Scheduled time ("tối nay", "sáng mai") ≠ urgent. Only urgent if time pressure.
  "họp tối nay" → false | "họp còn 1 tiếng nữa!" → true

[isImportant] — LONG-TERM VALUE only, not time pressure
ALWAYS true (domain-based, no keyword needed):
  • HEALTH: khám bệnh, uống thuốc, gym, workout, chạy bộ, yoga, thiền, xét nghiệm
  • FINANCE: nộp tiền, đóng thuế, trả nợ, hóa đơn, hợp đồng, ngân hàng, đầu tư
  • WORK DELIVERABLE: nộp báo cáo, submit, deploy, release, trình bày, demo cho sếp/khách
  • EDUCATION: thi, exam, nộp bài, học kỹ năng có mục tiêu, certification, luyện tập
  • PLANNING: lên kế hoạch, OKR, review mục tiêu, retrospective
ALWAYS false: xem phim/series, chơi game, lướt mạng, đi chợ thường, cà phê thường
CONTEXT: meetings → important if with boss/client/investor; reading → important if educational

[dueDate] — parse from CONTEXT block below
- Time-of-day (Vi): sáng sớm=06:00 sáng=08:00 trưa=12:00 chiều=14:00 chiều tối=17:00 tối=19:00 đêm=22:00
- Time-of-day (En): morning=08:00 noon=12:00 afternoon=14:00 evening=19:00 tonight=20:00
- Explicit: "lúc 3h chiều"→15:00 "9am"→09:00 "trước 5h"→17:00
- Date only, no time → 23:59. null if zero time reference.

[categoryId] — MUST attempt; never skip without reason
- Semantic match against categories in CONTEXT block.
- Guide: Công việc/Work←meetings,reports | Sức khỏe/Health←gym,doctor | Học tập/Study←study,exam
         Cá nhân/Personal←shopping,errands | Tài chính/Finance←bills,tax | Dự án/Project←code,design
- >60% confidence → use id. null only if no match or empty list.

[goalId] — >80% confidence the task contributes to goal → use id. Otherwise null.

[notes] — location, people, links, conditions not in title/checklists. null if nothing extra.

[checklists] — extract lists: "mua: A,B,C" | "gồm: ..." | "steps: 1. A 2. B" | "- item". null if none.

━━━ AMBIGUITY ━━━
- Short (1-2 words): still match categoryId + estimatedMinutes; leave dueDate/notes/checklists null.
- Ambiguous time without am/pm: use context clues, default afternoon=15:00.
- Mixed Vi/En: handle normally. Preserve user's language in title.`;

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
    // ── Q1: Urgent + Important ─────────────────────────────
    // Work deliverable + urgency keyword + weekday deadline
    {
      role: "user" as const,
      content: "nộp báo cáo quý trước thứ 6 gấp, mất khoảng 2 tiếng",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Nộp báo cáo quý",
        estimatedMinutes: 120,
        isUrgent: true,
        isImportant: true,
        dueDate: `${friday}T23:59:00`,
        categoryId: workCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Q1: Urgent + Important ─────────────────────────────
    // Health domain → always important; deadline today → urgent
    {
      role: "user" as const,
      content: "uống thuốc huyết áp tối nay không được quên",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Uống thuốc huyết áp",
        estimatedMinutes: 5,
        isUrgent: true,
        isImportant: true,
        dueDate: `${today}T20:00:00`,
        categoryId: healthCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Q2: Not Urgent + Important ─────────────────────────
    // Health → always important; no time pressure → not urgent
    {
      role: "user" as const,
      content: "tập gym",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Tập gym",
        estimatedMinutes: 60,
        isUrgent: false,
        isImportant: true,        // ← health is ALWAYS important
        dueDate: null,
        categoryId: healthCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Q2: Not Urgent + Important ─────────────────────────
    // Study/skill building → important; scheduled but no deadline pressure → not urgent
    {
      role: "user" as const,
      content: "study English 30 minutes tomorrow morning",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Study English",
        estimatedMinutes: 30,
        isUrgent: false,
        isImportant: true,        // ← education/learning is ALWAYS important
        dueDate: `${tomorrow}T08:00:00`,
        categoryId: studyCat?.id ?? null,
        goalId: null,
        notes: null,
        checklists: null,
      }),
    },
    // ── Q3: Urgent + Not Important ─────────────────────────
    // Routine meeting today with time pressure → urgent but not high-value
    {
      role: "user" as const,
      content: "họp sync team tối nay lúc 7h tại phòng họp B2",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Họp sync team",
        estimatedMinutes: 60,
        isUrgent: false,          // ← scheduled, no time pressure signal
        isImportant: false,       // ← casual routine sync, not a deliverable
        dueDate: `${today}T19:00:00`,
        categoryId: workCat?.id ?? null,
        goalId: null,
        notes: "Phòng họp B2",
        checklists: null,
      }),
    },
    // ── Q4: Not Urgent + Not Important ─────────────────────
    // Entertainment + errands → low-value, no deadline
    {
      role: "user" as const,
      content: "đi siêu thị mua: trứng, sữa tươi, bánh mì, rau cải",
    },
    {
      role: "assistant" as const,
      content: JSON.stringify({
        title: "Đi siêu thị",
        estimatedMinutes: 30,
        isUrgent: false,
        isImportant: false,       // ← routine errand, not high-value
        dueDate: null,
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
    const result = {
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

