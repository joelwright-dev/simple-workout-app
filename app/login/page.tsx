import { AuthForm } from "@/components/AuthForm";
import { authenticate } from "@/lib/actions";

export default function LoginPage() {
  return <AuthForm mode="login" action={authenticate} />;
}
