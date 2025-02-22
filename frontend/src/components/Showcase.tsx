/* ================ [ IMPORTS ] ================ */

// React components
import React, { useEffect, useState } from "react";

// Utility functions
import { cn } from "../../lib/utils";

/* ================ [ COMPONENT ] ================ */

// Image data
const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-13%20at%207.07.51%E2%80%AFPM-W3lbpVdvxZK0H7yImVCWdc9cE5Ke1G.png",
    alt: "Warm Brief Interface",
    caption: "Submit your campaign details",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-13%20at%207.08.05%E2%80%AFPM-Rz5LkEhL9jndjnURoy6NHLprp42Bj0.png",
    alt: "Warm Influencer Management",
    caption: "Select from committed influencers",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-13%20at%207.09.39%E2%80%AFPM-4ENlK1uqqWPSLXvMCBZ4hKD619pflH.png",
    alt: "Warm Chat Interface",
    caption: "Run campaign with Web -> Discord Chat system",
  },
];

// Showcase component
function Showcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="relative aspect-[16/9]">
          {images.map((image, index) => (
            <div
              key={image.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                index === currentIndex ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="relative w-full h-full">
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  style={{ objectFit: "contain" }}
                  className="rounded-xl shadow-[0_0_60px_rgba(255,97,0,0.36)] w-full h-full"
                />
              </div>
              <div
                className={cn(
                  "absolute -bottom-14 left-0 right-0 text-center transition-opacity duration-1000",
                  index === currentIndex ? "opacity-100" : "opacity-0"
                )}
              >
                <p className="text-sm font-bold text-gray-600">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Showcase };
