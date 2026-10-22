export default function Loading() {
  return (
    <main id="main" className="container loading-state" aria-busy="true">
      <span className="eyebrow">ONE MOMENT</span>
      <h1>Connecting the dots…</h1>
      <div className="loading-line" />
    </main>
  );
}
