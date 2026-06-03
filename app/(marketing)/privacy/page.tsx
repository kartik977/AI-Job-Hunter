export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-slate">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </p>
      <p className="mb-4">
        JobHunter AI (&quot;we&quot;) collects account information, resumes, and job
        descriptions you provide to deliver ATS analysis and optimization services.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Data we collect</h2>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Email and profile information via Supabase Auth</li>
        <li>Resume files and parsed content stored in Supabase</li>
        <li>Usage metrics for billing and rate limiting</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">AI processing</h2>
      <p className="text-muted-foreground">
        By default, analysis runs on our server using a free local engine (no external AI).
        If you configure Groq or OpenAI keys, extracted text may be sent to those providers.
        We do not sell your data.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Your rights</h2>
      <p className="text-muted-foreground">
        You may delete your account from Settings → Profile, which removes associated
        data from our systems.
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        Contact: privacy@jobhunter.ai
      </p>
    </div>
  );
}
