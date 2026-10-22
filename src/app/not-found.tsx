import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container page-space">
      <p className="eyebrow">404 / A LOOSE END</p>
      <h1>Nothing at this address.</h1>
      <p className="lede">
        This page may have moved, or the project hasn’t been published yet.
      </p>
      <Link className="button button-light" href="/projects">
        Explore the work ↗
      </Link>
    </main>
  );
}
