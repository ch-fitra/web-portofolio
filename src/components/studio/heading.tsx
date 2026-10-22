export function StudioHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="studio-heading">
      <p className="eyebrow">OWNER STUDIO / CONTENT</p>
      <h1>{title}</h1>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
