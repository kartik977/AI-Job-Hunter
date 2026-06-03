import "server-only";
import { getOpenAI } from "@/lib/ai/client";
import {
  ANALYZE_ATS_PROMPT,
  COVER_LETTER_PROMPT,
  OPTIMIZE_RESUME_PROMPT,
  PARSE_RESUME_PROMPT,
} from "@/lib/ai/prompts";
import {
  atsAnalysisSchema,
  coverLetterSchema,
  optimizeResultSchema,
  resumeContentSchema,
  type AtsAnalysis,
  type ResumeContent,
} from "@/types/resume";

export async function parseResumeWithOpenAI(text: string) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PARSE_RESUME_PROMPT },
      { role: "user", content: `Parse this resume text:\n\n${text}` },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  return resumeContentSchema.parse({
    ...JSON.parse(raw),
    rawText: text.slice(0, 5000),
  });
}

export async function analyzeWithOpenAI(resume: ResumeContent, jd: string) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYZE_ATS_PROMPT },
      { role: "user", content: JSON.stringify({ resume, jobDescription: jd }) },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  return atsAnalysisSchema.parse(JSON.parse(raw));
}

export async function optimizeWithOpenAI(
  resume: ResumeContent,
  jd: string,
  analysis: AtsAnalysis
) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: OPTIMIZE_RESUME_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ resume, jobDescription: jd, analysis }),
      },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  const partial = optimizeResultSchema.parse(JSON.parse(raw));
  const merged = resumeContentSchema.parse({
    ...resume,
    summary: partial.summary ?? resume.summary,
    experience: partial.experience ?? resume.experience,
    skills: partial.skills ?? resume.skills,
  });
  return { content: merged, changesSummary: partial.changes_summary };
}

export async function coverLetterWithOpenAI(
  resume: ResumeContent,
  jd: string,
  company: string,
  title: string
) {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COVER_LETTER_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ resume, jobDescription: jd, company, title }),
      },
    ],
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  return coverLetterSchema.parse(JSON.parse(raw));
}
