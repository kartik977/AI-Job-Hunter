import type { AtsAnalysis } from "@/types/resume";
import type { ResumeContent } from "@/types/resume";
import { extractKeywords, resumeToSearchableText } from "@/lib/ai/local/keywords";

export function analyzeResumeLocal(
  resume: ResumeContent,
  jobDescription: string
): AtsAnalysis {
  const jdKeywords = extractKeywords(jobDescription, 35);
  const resumeText = resumeToSearchableText(resume);

  const keyword_matches: string[] = [];
  const missing_keywords: string[] = [];

  for (const kw of jdKeywords) {
    if (resumeText.includes(kw)) {
      keyword_matches.push(kw);
    } else {
      missing_keywords.push(kw);
    }
  }

  const matchRatio =
    jdKeywords.length > 0 ? keyword_matches.length / jdKeywords.length : 0;
  const overall_score = Math.round(
    Math.min(100, Math.max(15, matchRatio * 85 + (resume.skills.length > 5 ? 10 : 0)))
  );

  const section_issues: AtsAnalysis["section_issues"] = [];
  if (!resume.summary?.trim()) {
    section_issues.push({
      section: "Summary",
      issue: "Add a short professional summary with role-specific keywords.",
      severity: "medium",
    });
  }
  if (resume.skills.length < 5) {
    section_issues.push({
      section: "Skills",
      issue: "Skills section is thin — mirror terms from the job description.",
      severity: "high",
    });
  }
  if (resume.experience.length === 0) {
    section_issues.push({
      section: "Experience",
      issue: "No experience entries detected — check PDF parsing.",
      severity: "high",
    });
  }

  const priority_actions: AtsAnalysis["priority_actions"] = [];
  for (const kw of missing_keywords.slice(0, 5)) {
    priority_actions.push({
      action: `Add "${kw}" naturally to skills or a recent bullet.`,
      impact: "high",
    });
  }
  if (missing_keywords.length > 5) {
    priority_actions.push({
      action: `Address ${missing_keywords.length - 5} more missing keywords via optimization.`,
      impact: "medium",
    });
  }
  if (overall_score < 60) {
    priority_actions.push({
      action: "Use one-column layout and standard headings (Experience, Education, Skills).",
      impact: "medium",
    });
  }

  return {
    overall_score,
    keyword_matches,
    missing_keywords,
    section_issues,
    priority_actions,
    summary: `Local ATS scan: ${keyword_matches.length}/${jdKeywords.length} job keywords found in your resume (${overall_score}% match). No paid API used.`,
  };
}
