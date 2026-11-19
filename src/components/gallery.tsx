import { useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { galleryPhotos as photos } from "@/lib/gallery";

export function Gallery() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [watching, setWatching] = useState(false);
  const count = photos.length;
  const active = count ? ((step % count) + count) % count : 0;
  useEffect(() => {
    if (
      count < 2 ||
      watching ||
      paused ||
      hover ||
      focused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => setStep((value) => value + 1), 4000);
    return () => window.clearInterval(timer);
  }, [active, count, paused, hover, focused, watching]);
  function move(offset: number) {
    setWatching(false);
    setStep((value) => value + offset);
  }
  if (!count)
    return (
      <div className="bg-heal-soft rounded-2xl p-7 text-center">
        <Camera className="mx-auto mb-4" />
        <h3 className="text-xl">From our community, with care</h3>
      </div>
    );
  const angle = 360 / count;
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
      <div className="relative rounded-[2.5rem] bg-[image:var(--gradient-gold)] p-[2px] shadow-[var(--shadow-3d)]">
        <div className="rounded-[2.4rem] bg-card p-6 sm:p-10">
          <div className="reference-gallery relative mx-auto w-full">
            <div
              className="carousel-3d relative"
              data-testid="gallery-rotor"
              style={{ transform: `rotateY(${-step * angle}deg)` }}
            >
              {photos.map((photo, index) => {
                const selected = index === active;
                return (
                  <figure
                    key={photo.src}
                    className="carousel-face absolute inset-0 overflow-hidden rounded-2xl bg-primary shadow-[var(--shadow-3d)] ring-1 ring-[var(--gold)]/40"
                    aria-hidden={!selected}
                    inert={!selected}
                    style={{
                      transform: `rotateY(${index * angle}deg) translateZ(280px)`,
                      opacity: selected ? 1 : 0.55,
                      filter: selected ? "none" : "brightness(0.85) saturate(0.9)",
                    }}
                  >
                    {photo.kind === "video" && selected ? (
                      <video
                        key={photo.src}
                        controls
                        playsInline
                        onPlay={() => setWatching(true)}
                        onEnded={() => setWatching(false)}
                        preload="none"
                        poster={photo.poster}
                        aria-label={photo.alt}
                        className="absolute inset-x-0 top-0 h-[calc(100%-80px)] w-full object-contain"
                      >
                        <source src={photo.src} type="video/mp4" />
                        {photo.captions && (
                          <track
                            kind="captions"
                            src={photo.captions}
                            srcLang="en"
                            label="English"
                            default
                          />
                        )}
                        Your browser cannot play this video. <a href={photo.src}>Download video</a>
                      </video>
                    ) : photo.kind !== "video" || photo.poster ? (
                      <img
                        src={photo.poster ?? photo.src}
                        alt={photo.alt}
                        width={photo.width ?? 1280}
                        height={photo.height ?? 720}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="m-auto h-full w-20 text-primary-foreground" />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                        {photo.tag}
                      </span>
                      <span className="rounded-full bg-[image:var(--gradient-gold)] px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <figcaption
                      className={`pointer-events-none absolute inset-x-0 bottom-0 p-5 text-primary-foreground ${photo.kind === "video" ? "h-20 bg-primary" : "bg-gradient-to-t from-primary/90 via-primary/50 to-transparent"}`}
                    >
                      <strong className="font-display text-lg font-semibold sm:text-xl">
                        {photo.title}
                      </strong>
                      <span className="mt-1 block text-xs text-primary-foreground/80">
                        {photo.credit}
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <button
              type="button"
              className="gallery-control"
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {photos.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  className="gallery-position"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-pressed={active === index}
                  onClick={() => {
                    if (index !== active) move(index - active);
                  }}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="gallery-control"
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="gallery-control"
              aria-label={paused ? "Play gallery" : "Pause gallery"}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
          <p className="sr-only" aria-live={paused || focused ? "polite" : "off"}>
            {active + 1} / {count}: {photos[active]?.title}
          </p>
        </div>
      </div>
    </div>
  );
}
