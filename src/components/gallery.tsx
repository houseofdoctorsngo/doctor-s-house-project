import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "./ui/button";
import { galleryPhotos as photos } from "@/lib/gallery";

export function Gallery() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (
      photos.length < 2 ||
      photos[active]?.kind === "video" ||
      paused ||
      hover ||
      focused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % photos.length), 4500);
    return () => window.clearInterval(timer);
  }, [active, paused, hover, focused]);
  if (!photos.length)
    return (
      <div className="bg-heal-soft rounded-2xl p-7 text-center">
        <Camera className="mx-auto mb-4" size={32} />
        <h3 className="text-xl">From our community, with care</h3>
        <p className="text-sm text-muted-foreground leading-7 mt-2 max-w-lg mx-auto">
          Photographs from our camps will be shared here with the permission of the people pictured.
          To learn more about our work, contact our team or request our impact report below.
        </p>
        <a
          className="inline-block underline text-sm mt-3"
          href="mailto:houseofdoctorsngo@gmail.com?subject=Camp%20activities%20and%20impact%20report"
        >
          Request an update
        </a>
      </div>
    );
  const photo = photos[active]!;
  return (
    <div
      role="region"
      aria-label="NGO field photos and videos"
      aria-roledescription="carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <figure className="rounded-2xl overflow-hidden gold-ring bg-heal-soft">
        {photo.kind === "video" ? (
          <video
            key={photo.src}
            controls
            playsInline
            preload="none"
            poster={photo.poster}
            aria-label={photo.alt}
            className="w-full max-h-96"
          >
            <source src={photo.src} />
            {photo.captions && (
              <track kind="captions" src={photo.captions} srcLang="en" label="English" default />
            )}
            Your browser cannot play this video. <a href={photo.src}>Download video</a>
          </video>
        ) : (
          <img
            src={photo.src}
            alt={photo.alt}
            width={1200}
            height={800}
            loading="lazy"
            className="w-full max-h-96 object-contain"
          />
        )}
        <figcaption className="p-4 text-sm">
          <strong>{photo.title}</strong>
          <span className="block text-xs text-muted-foreground mt-1">{photo.credit}</span>
          {photo.transcript && (
            <details className="mt-3">
              <summary>Video description and transcript</summary>
              <p className="mt-2 whitespace-pre-line">{photo.transcript}</p>
            </details>
          )}
        </figcaption>
      </figure>
      {photos.length > 1 && (
        <div className="flex gap-3 justify-center items-center mt-4">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous photo"
            onClick={() => setActive((index) => (index - 1 + photos.length) % photos.length)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-xs">
            {active + 1} / {photos.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next photo"
            onClick={() => setActive((index) => (index + 1) % photos.length)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={paused ? "Play gallery" : "Pause gallery"}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play /> : <Pause />}
          </Button>
        </div>
      )}
    </div>
  );
}
