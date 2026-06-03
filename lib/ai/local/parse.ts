import { resumeContentSchema, type ResumeContent } from "@/types/resume";

const SECTION_HEADERS =
  /^(experience|work experience|employment|education|skills|technical skills|summary|profile|projects|certifications)\s*$/im;

export function parseResumeLocal(rawText: string): ResumeContent {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const email =
    text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0] ?? undefined;
  const phone =
    text.match(/\+?[\d\s().-]{10,}/)?.[0]?.trim() ?? undefined;
  const linkedin = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0];

  let name: string | undefined;
  if (lines[0] && !lines[0].includes("@") && lines[0].length < 60) {
    name = lines[0];
  }

  const sections: Record<string, string[]> = {};
  let current = "header";
  for (const line of lines) {
    if (SECTION_HEADERS.test(line)) {
      current = line.toLowerCase().replace(/\s+/g, "_");
      sections[current] = [];
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }

  const summaryLines = sections.summary ?? sections.profile ?? [];
  const summary = summaryLines.join(" ").slice(0, 800) || undefined;

  const skillsBlock = [
    ...(sections.skills ?? []),
    ...(sections.technical_skills ?? []),
  ].join(" ");
  const skills = [
    ...new Set(
      skillsBlock
        .split(/[,;|•·]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 50)
    ),
  ].slice(0, 40);

  const experience: ResumeContent["experience"] = [];
  const expLines = sections.experience ?? sections.work_experience ?? [];
  let currentJob: ResumeContent["experience"][0] | null = null;

  for (const line of expLines) {
    const isBullet = /^[-•*]\s*/.test(line) || /^\d+\.\s/.test(line);
    if (isBullet && currentJob) {
      currentJob.bullets.push(line.replace(/^[-•*\d.]+\s*/, ""));
    } else if (
      line.length > 3 &&
      (line.includes("|") || /\d{4}/.test(line) || line.length < 80)
    ) {
      if (currentJob) experience.push(currentJob);
      const parts = line.split("|").map((p) => p.trim());
      currentJob = {
        title: parts[0] ?? line,
        company: parts[1] ?? "Company",
        bullets: [],
      };
      const dates = line.match(
        /(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present)/i
      );
      if (dates) {
        currentJob.startDate = dates[1];
        currentJob.endDate = dates[2];
      }
    }
  }
  if (currentJob) experience.push(currentJob);

  const education: ResumeContent["education"] = [];
  for (const line of sections.education ?? []) {
    if (line.length > 3) {
      education.push({ institution: line, degree: undefined });
    }
  }

  return resumeContentSchema.parse({
    contact: { name, email, phone, linkedin },
    summary,
    experience: experience.length ? experience : [],
    education,
    skills,
    rawText: text.slice(0, 5000),
  });
}
