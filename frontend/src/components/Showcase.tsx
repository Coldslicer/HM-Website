/* ================ [ IMPORTS ] ================ */

// React components
import { useEffect, useState } from "react";

// Utility functions
import { cn } from "../lib/utility";

// Import images
import welcome from "../assets/showcase-welcome.png";
import brief from "../assets/showcase-brief.png";
import creators from "../assets/showcase-creators.png";
import contract from "../assets/showcase-contract.png";
import messaging from "../assets/showcase-messaging.png";
import timeline from "../assets/showcase-timeline.png";
import payment from "../assets/showcase-payment.png";

/* ================ [ COMPONENT ] ================ */

// Image data
const images = [
  {
    src: welcome,
    alt: "A WARM Welcome", // heh
    caption: "Set up your campaign with ease",
  },
  {
    src: brief,
    alt: "WARM Brief Form",
    caption: "Submit your campaign details",
  },
  {
    src: creators,
    alt: "WARM Creator Selection",
    caption: "Select from committed influencers",
  },
  {
    src: contract,
    alt: "WARM Contract Signing",
    caption: "Sign a secure contract with influencers",
  },
  {
    src: messaging,
    alt: "WARM Messaging w/ Discord",
    caption: "Run your campaign with full Discord integration",
  },
  {
    src: timeline,
    alt: "WARM Creator Timeline",
    caption: "Track the progress of your campaign",
  },
  {
    src: payment,
    alt: "WARM Payment Invoicing",
    caption: "Simple invoice-based payment system",
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
                  src={image.src}
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
                <p className="text-sm font-bold text-gray-600">
                  {image.caption}
                </p>
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
