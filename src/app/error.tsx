"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container page-space">
      <p className="eyebrow">CONNECTION INTERRUPTED</p>
      <h1>Let’s try that again.</h1>
      <p className="lede">
        This page could not load. Please try again shortly.
      </p>
      <button className="button button-light" onClick={reset}>
        Try again
      </button>
      <Link href="/" className="text-link">
        Return home
      </Link>
    </main>
  );
}
