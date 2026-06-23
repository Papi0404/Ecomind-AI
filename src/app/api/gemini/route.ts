/**
 * app/api/gemini/route.ts
 * ------------------------
 * Centralised, server-only Gemini AI endpoint.
 *
 * Security measures:
 *  • GEMINI_API_KEY never leaves the server (no NEXT_PUBLIC_ prefix)
 *  • Zod input validation with strict length/character limits (prompt injection mitigation)
 *  • Per-IP rate limiting: 10 requests / 60 s
 *  • Output HTML-encoding before returning to client (XSS mitigation)
 *  • Authenticated users only
 *
 * Supported actions (POST body):
 *  { action: 'chat',       messages: [...], prompt: string }
 *  { action: 'verify',     claim: string }
 *  { action: 'summarize',  text: string }
 *  { action: 'classify',   item: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { rateLimitCheck, buildRateLimitResponse } from '@/lib/rate-limit';
import {
  getAIChatResponse,
  verifyClaim,
  summarizeProcedure,
  classifyWaste,
} from '@/lib/ai';

// ─── Prompt Injection Defense Constants ─────────────────────────────────────
/** Maximum allowed length for any free-text user input */
const MAX_TEXT_LENGTH = 4000;

/**
 * Patterns that are classic prompt-injection attempts.
 * Requests matching these are rejected before hitting the model.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+(a\s+)?(?:dan|evil|jailbreak|DAN|GPT)/i,
  /system\s*:\s*you\s+are/i,
  /\[system\]/i,
  /\<\|im_start\|\>/i,
  /act\s+as\s+(if\s+)?(?:you\s+are|a)/i,
  /forget\s+(your\s+)?instructions?/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+(your\s+)?(system\s+)?prompt/i,
];

function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(input));
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(MAX_TEXT_LENGTH),
});

const chatSchema = z.object({
  action: z.literal('chat'),
  messages: z.array(messageSchema).max(50),
  prompt: z.string().min(1).max(MAX_TEXT_LENGTH),
});

const verifySchema = z.object({
  action: z.literal('verify'),
  claim: z.string().min(5).max(MAX_TEXT_LENGTH),
});

const summarizeSchema = z.object({
  action: z.literal('summarize'),
  text: z.string().min(20).max(MAX_TEXT_LENGTH),
});

const classifySchema = z.object({
  action: z.literal('classify'),
  item: z.string().min(1).max(500),
});

const bodySchema = z.discriminatedUnion('action', [
  chatSchema,
  verifySchema,
  summarizeSchema,
  classifySchema,
]);

// ─── Output Sanitizer ────────────────────────────────────────────────────────
/**
 * HTML-encode characters that could cause XSS if the output is
 * rendered as raw HTML in the browser (belt-and-suspenders defense).
 * For Markdown-rendered content this is a secondary layer.
 */
function htmlEncode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize an object's string leaves (recursive).
 * Used for structured JSON responses (verify / classify).
 */
function sanitizeOutput<T>(value: T): T {
  if (typeof value === 'string') return htmlEncode(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitizeOutput) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeOutput(v);
    }
    return out as T;
  }
  return value;
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Authentication guard
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Per-IP rate limiting (10 req / 60 s)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    (req as NextRequest & { ip?: string }).ip ??
    '127.0.0.1';

  const rateResult = await rateLimitCheck(ip, 'gemini');
  if (!rateResult.allowed) {
    return buildRateLimitResponse(rateResult);
  }

  // 3. Parse & validate body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Input tidak valid.' },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 4. Prompt Injection Detection
  const textsToCheck: string[] = [];
  if (data.action === 'chat') textsToCheck.push(data.prompt, ...data.messages.map((m) => m.content));
  if (data.action === 'verify') textsToCheck.push(data.claim);
  if (data.action === 'summarize') textsToCheck.push(data.text);
  if (data.action === 'classify') textsToCheck.push(data.item);

  if (textsToCheck.some(detectInjection)) {
    return NextResponse.json(
      { message: 'Input mengandung pola yang tidak diizinkan.' },
      { status: 400 }
    );
  }

  // 5. Dispatch to AI function and return sanitized response
  try {
    switch (data.action) {
      case 'chat': {
        const text = await getAIChatResponse(data.messages, data.prompt);
        // Chat uses Markdown renderer on client — encode only < > to prevent raw HTML injection
        const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return NextResponse.json({ result: safe });
      }

      case 'verify': {
        const result = await verifyClaim(data.claim);
        return NextResponse.json({ result: sanitizeOutput(result) });
      }

      case 'summarize': {
        const text = await summarizeProcedure(data.text);
        const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return NextResponse.json({ result: safe });
      }

      case 'classify': {
        const result = await classifyWaste(data.item);
        return NextResponse.json({ result: sanitizeOutput(result) });
      }

      default:
        return NextResponse.json({ message: 'Aksi tidak dikenal.' }, { status: 400 });
    }
  } catch (error) {
    console.error('[/api/gemini] AI processing error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memproses permintaan AI.' },
      { status: 500 }
    );
  }
}
