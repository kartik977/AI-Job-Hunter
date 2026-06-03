import "server-only";
import type { AtsAnalysis, ResumeContent } from "@/types/resume";
import { analyzeResumeLocal } from "@/lib/ai/local/analyze";
import { parseResumeLocal } from "@/lib/ai/local/parse";
import { optimizeResumeLocal } from "@/lib/ai/local/optimize";
import { generateCoverLetterLocal } from "@/lib/ai/local/cover-letter";

export type AiProvider = "local" | "groq" | "openai";

export function getAiProvider(): AiProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GROQ_API_KEY) return "groq";
  return "local";
}

export function getAiProviderLabel(): string {
  const p = getAiProvider();
  if (p === "local") return "Free local engine (no API cost)";
  if (p === "groq") return "Groq free tier";
  return "OpenAI";
}

async function groqChat(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty Groq response");
  return content;
}

export async function parseResumeFromText(rawText: string): Promise<ResumeContent> {
  const provider = getAiProvider();
  if (provider === "local") {
    return parseResumeLocal(rawText);
  }

  const { PARSE_RESUME_PROMPT } = await import("@/lib/ai/prompts");
  const { resumeContentSchema } = await import("@/types/resume");
  const text = rawText.slice(0, 30000);

  if (provider === "groq") {
    const raw = await groqChat(
      PARSE_RESUME_PROMPT,
      `Parse this resume text:\n\n${text}`
    );
    return resumeContentSchema.parse({
      ...JSON.parse(raw),
      rawText: text.slice(0, 5000),
    });
  }

  const { parseResumeWithOpenAI } = await import("@/lib/ai/openai");
  return parseResumeWithOpenAI(text);
}

export async function analyzeResume(
  resume: ResumeContent,
  jobDescription: string
): Promise<AtsAnalysis> {
  const provider = getAiProvider();
  if (provider === "local") {
    return analyzeResumeLocal(resume, jobDescription);
  }

  const { ANALYZE_ATS_PROMPT } = await import("@/lib/ai/prompts");
  const { atsAnalysisSchema } = await import("@/types/resume");
  const jd = jobDescription.slice(0, 12000);
  const payload = JSON.stringify({ resume, jobDescription: jd });

  if (provider === "groq") {
    const raw = await groqChat(ANALYZE_ATS_PROMPT, payload);
    return atsAnalysisSchema.parse(JSON.parse(raw));
  }

  const { analyzeWithOpenAI } = await import("@/lib/ai/openai");
  return analyzeWithOpenAI(resume, jd);
}

export async function optimizeResume(
  resume: ResumeContent,
  jobDescription: string,
  analysis: AtsAnalysis
) {
  const provider = getAiProvider();
  if (provider === "local") {
    return optimizeResumeLocal(resume, jobDescription, analysis);
  }

  const { OPTIMIZE_RESUME_PROMPT } = await import("@/lib/ai/prompts");
  const { optimizeResultSchema, resumeContentSchema } = await import("@/types/resume");
  const jd = jobDescription.slice(0, 12000);
  const payload = JSON.stringify({ resume, jobDescription: jd, analysis });

  let partial;
  if (provider === "groq") {
    const raw = await groqChat(OPTIMIZE_RESUME_PROMPT, payload);
    partial = optimizeResultSchema.parse(JSON.parse(raw));
  } else {
    const { optimizeWithOpenAI } = await import("@/lib/ai/openai");
    return optimizeWithOpenAI(resume, jd, analysis);
  }

  const merged = resumeContentSchema.parse({
    ...resume,
    summary: partial.summary ?? resume.summary,
    experience: partial.experience ?? resume.experience,
    skills: partial.skills ?? resume.skills,
  });

  return { content: merged, changesSummary: partial.changes_summary };
}

export async function generateCoverLetter(
  resume: ResumeContent,
  jobDescription: string,
  company: string,
  title: string
) {
  const provider = getAiProvider();
  if (provider === "local") {
    return generateCoverLetterLocal(resume, jobDescription, company, title);
  }

  const { COVER_LETTER_PROMPT } = await import("@/lib/ai/prompts");
  const { coverLetterSchema } = await import("@/types/resume");
  const jd = jobDescription.slice(0, 12000);
  const payload = JSON.stringify({ resume, jobDescription: jd, company, title });

  if (provider === "groq") {
    const raw = await groqChat(COVER_LETTER_PROMPT, payload);
    return coverLetterSchema.parse(JSON.parse(raw));
  }

  const { coverLetterWithOpenAI } = await import("@/lib/ai/openai");
  return coverLetterWithOpenAI(resume, jd, company, title);
}
