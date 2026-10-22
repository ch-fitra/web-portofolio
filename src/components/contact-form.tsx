"use client";
import { useActionState, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { submitContact } from "@/app/actions";
const compactQuery = "(max-width: 760px), (max-height: 700px)";
const subscribeCompact = (callback: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
export function ContactForm({
  initialType = "hiring",
}: {
  initialType?: "hiring" | "freelance";
}) {
  const [state, action, pending] = useActionState(submitContact, {
    ok: false,
    message: "",
  });
  const compact = useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(compactQuery).matches,
    () => false,
  );
  const [step, setStep] = useState(1);
  function advance(form: HTMLFormElement) {
    for (const name of ["name", "email"]) {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      if (!input.reportValidity()) return;
    }
    setStep(2);
    requestAnimationFrame(() =>
      (form.elements.namedItem("message") as HTMLTextAreaElement).focus(),
    );
  }
  const type = initialType;
  const [fields, setFields] = useState({
    name: "",
    email: "",
    message: "",
    budget: "",
    timeline: "",
    consent: false,
  });
  return (
    <form
      action={action}
      className="contact-form"
      data-enter="panel"
      style={{ animationDelay: "230ms" }}
      data-success={state.ok}
      data-step={step}
      onSubmit={(event) => {
        if (compact && step === 1) {
          event.preventDefault();
          advance(event.currentTarget);
        }
      }}
    >
      <div className="contact-step-indicator" aria-live="polite">
        <span>0{step} / 02</span>
        <span>
          {step === 1 ? "Let's get acquainted" : "A little about your idea"}
        </span>
      </div>
      <div className="contact-step contact-step-one">
        <input type="hidden" name="type" value={type} />
        <div className="form-grid">
          <label>
            Your name
            <input
              name="name"
              value={fields.name}
              onChange={(event) =>
                setFields((v) => ({ ...v, name: event.target.value }))
              }
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="How should I call you?"
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              value={fields.email}
              onChange={(event) =>
                setFields((v) => ({ ...v, email: event.target.value }))
              }
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@company.com"
            />
          </label>
        </div>
      </div>
      <div className="contact-step contact-step-two">
        <label>
          {type === "hiring"
            ? "Tell me about the role"
            : "Tell me about your project"}
          <textarea
            aria-label={
              type === "hiring"
                ? "Tell me about the role"
                : "Tell me about your project"
            }
            name="message"
            value={fields.message}
            onChange={(event) =>
              setFields((v) => ({ ...v, message: event.target.value }))
            }
            required={!compact || step === 2}
            minLength={20}
            maxLength={5000}
            rows={3}
            placeholder="A little context goes a long way…"
          />
        </label>
        {type === "freelance" && (
          <div className="form-grid">
            <label>
              Budget (optional)
              <input
                name="budget"
                value={fields.budget}
                onChange={(event) =>
                  setFields((v) => ({ ...v, budget: event.target.value }))
                }
                maxLength={300}
                placeholder="A range or let’s discuss"
              />
            </label>
            <label>
              Timeline (optional)
              <input
                name="timeline"
                value={fields.timeline}
                onChange={(event) =>
                  setFields((v) => ({ ...v, timeline: event.target.value }))
                }
                maxLength={300}
                placeholder="When are you looking to start?"
              />
            </label>
          </div>
        )}
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="consent"
            required={!compact || step === 2}
            checked={fields.consent}
            onChange={(event) =>
              setFields((v) => ({ ...v, consent: event.target.checked }))
            }
          />{" "}
          <span>
            I agree to the <Link href="/privacy">privacy policy</Link> and the
            use of my details to respond to this inquiry.
          </span>
        </label>
      </div>
      <div className="contact-form-actions">
        <button
          className="button button-outline contact-back"
          type="button"
          onClick={() => setStep(1)}
        >
          Back
        </button>
        <button
          className="button button-light contact-next"
          type="button"
          onClick={(event) => advance(event.currentTarget.form!)}
        >
          Continue
        </button>
        <button
          className="button button-light contact-submit"
          disabled={pending || state.ok}
        >
          {pending
            ? "Saving your message…"
            : state.ok
              ? "Message saved ✓"
              : "Send message ↗"}
        </button>
      </div>
      {state.message && (
        <p
          className={`form-status ${state.ok ? "success" : "failure"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
