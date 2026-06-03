import type { AtsAnalysis, ResumeContent } from "@/types/resume";
import { analyzeResumeLocal } from "@/lib/ai/local/analyze";

export function optimizeResumeLocal(
  resume: ResumeContent,
  jobDescription: string,
  analysis?: AtsAnalysis
) {
  const a = analysis ?? analyzeResumeLocal(resume, jobDescription);
  const missing = new Set(a.missing_keywords.slice(0, 8));

  const mergedSkills = [
    ...new Set([...resume.skills, ...missing]),
  ].slice(0, 50);

  const experience = resume.experience.map((exp, idx) => {
    if (idx > 1 || missing.size === 0) return exp;
    const kw = [...missing].slice(0, 2).join(", ");
    const bullets = [...exp.bullets];
    if (bullets.length > 0 && kw) {
      const last = bullets[0];
      if (!last.toLowerCase().includes(kw.split(",")[0]!)) {
        bullets[0] = `${last} (Keywords: ${kw})`;
      }
    }
    return { ...exp, bullets };
  });

  const summary =
    resume.summary ||
    `Results-driven professional targeting this role. Strengths: ${mergedSkills.slice(0, 6).join(", ")}.`;

  const content: ResumeContent = {
    ...resume,
    summary,
    skills: mergedSkills,
    experience,
  };

  return {
    content,
    changesSummary: `Added ${missing.size} missing keywords to skills and highlighted terms in top experience bullets. 100% local — no paid API.`,
  };
}
