export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </p>
      <p className="mb-4 text-muted-foreground">
        By using JobHunter AI you agree to use the service lawfully and provide
        accurate resume content. AI suggestions are advisory; you are responsible
        for final submissions.
      </p>
      <p className="text-muted-foreground">
        JobHunter AI is offered free of charge. Optional third-party services (e.g. Supabase)
        have their own terms.
      </p>
    </div>
  );
}
