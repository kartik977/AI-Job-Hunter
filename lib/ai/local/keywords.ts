const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "your", "you", "our",
  "will", "are", "was", "have", "has", "been", "being", "their", "they", "them",
  "about", "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "then", "once", "here", "there",
  "when", "where", "why", "how", "all", "each", "few", "more", "most", "other",
  "some", "such", "only", "own", "same", "than", "too", "very", "can", "just",
  "should", "now", "job", "role", "position", "company", "team", "work", "years",
  "year", "experience", "required", "preferred", "ability", "including", "etc",
]);

export function extractKeywords(text: string, max = 40): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

export function resumeToSearchableText(resume: {
  summary?: string;
  skills: string[];
  experience: { title: string; company: string; bullets: string[] }[];
  education: { institution: string; degree?: string }[];
}): string {
  const parts = [
    resume.summary ?? "",
    resume.skills.join(" "),
    ...resume.experience.flatMap((e) => [
      e.title,
      e.company,
      ...e.bullets,
    ]),
    ...resume.education.map((e) => `${e.institution} ${e.degree ?? ""}`),
  ];
  return parts.join(" ").toLowerCase();
}
