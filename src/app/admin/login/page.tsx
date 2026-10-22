import Link from "next/link";
import { redirect } from "next/navigation";
import { currentOwner } from "@/lib/auth";
import { LoginForm } from "@/components/studio/forms";
export default async function Login() {
  if (await currentOwner()) redirect("/admin");
  return (
    <main id="main" className="login-wrap">
      <div className="login-card">
        <Link className="wordmark" href="/">
          ch-fitra
          <span className="tiny-dot" />
        </Link>
        <p className="eyebrow">PRIVATE / OWNER STUDIO</p>
        <h1>
          A space to
          <br />
          shape the work.
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
