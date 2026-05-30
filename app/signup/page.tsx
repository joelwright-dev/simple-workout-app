import { AuthForm } from "@/components/AuthForm";
import { register } from "@/lib/actions";

export default function SignupPage() {
  return <AuthForm mode="signup" action={register} />;
}
