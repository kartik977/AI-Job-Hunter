export const PARSE_RESUME_PROMPT = `Extract structured resume data from the raw text. Return JSON matching the schema. Preserve factual content; do not invent employers or degrees.`;

export const ANALYZE_ATS_PROMPT = `You are an ATS resume expert. Compare the structured resume against the job description.
Score 0-100 for ATS match. List matched and missing keywords. Flag formatting/section issues for ATS parsers.
Provide prioritized actionable improvements. Be specific and honest.`;

export const OPTIMIZE_RESUME_PROMPT = `Rewrite resume sections to better match the job description while staying truthful.
Only rephrase existing achievements; do not fabricate experience. Improve keywords naturally.
Return updated summary, experience bullets, and skills where applicable.`;

export const COVER_LETTER_PROMPT = `Write a professional cover letter tailored to the job description and candidate resume.
Use a confident, concise tone. 3-4 paragraphs. No placeholder brackets.`;
