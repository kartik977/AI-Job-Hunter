import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function SignupPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}
