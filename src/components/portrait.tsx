import Image from "next/image";
import { getMedia } from "@/lib/content";
import { NeuralMesh } from "./neural-mesh";
export async function Portrait({
  id,
  position = 50,
  variant = "home",
}: {
  id: string;
  position?: number;
  variant?: "home" | "about";
}) {
  const media = await getMedia(id);
  return (
    <div
      className={`portrait portrait-${variant}`}
      data-enter={variant === "about" ? "portrait" : undefined}
      style={variant === "about" ? { animationDelay: "160ms" } : undefined}
    >
      <div className="portrait-grid" aria-hidden="true" />
      {!media && <NeuralMesh />}
      {media ? (
        <Image
          src={`/media/${media.id}`}
          alt={media.alt}
          fill
          priority={variant === "home"}
          unoptimized
          style={{ objectFit: "cover", objectPosition: `50% ${position}%` }}
          sizes="(max-width: 760px) 100vw, 40vw"
        />
      ) : (
        <div
          className="portrait-placeholder"
          aria-label={`${variant === "home" ? "Home" : "About"} portrait not yet supplied`}
        >
          <span className="portrait-monogram">
            cf<span>.</span>
          </span>
          <span className="portrait-caption">A FACE BEHIND THE CODE</span>
        </div>
      )}
      <div className="portrait-cross top-left" aria-hidden="true">
        +
      </div>
      <div className="portrait-cross bottom-right" aria-hidden="true">
        +
      </div>
      <div className="portrait-label">
        <span className="status-dot" /> HUMAN AT THE CORE
      </div>
    </div>
  );
}
