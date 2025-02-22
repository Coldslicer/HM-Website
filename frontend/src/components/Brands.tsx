/* ================ [ IMPORTS ] ================ */

// React components
import React from "react";

/* ================ [ COMPONENT ] ================ */

// Brands component
function Brands() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-12 font-montserrat">
          Our casting calls have brought success to
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-14%20at%202.47.14%E2%80%AFAM-aHJXEDgrq2uQKkO0UPOkx8zUioywif.png"
            alt="Brand Logos"
            className="col-span-2 md:col-span-5 w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Brands };
