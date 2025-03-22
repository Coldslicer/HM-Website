/* ================ [ IMPORTS ] ================ */

// React components
import React from "react";

// UI components
import { Button } from "./ui/Button";

/* ================ [ COMPONENT ] ================ */

// Hero component
function Hero() {
  return (
    <section className="pt-32 pb-16 px-4">
      <div className="container mx-auto max-w-6xl text-center">
        <h1 className="text-[2.55rem] md:text-[3.825rem] font-bold mb-6 font-montserrat">
          Influencer Casting Calls
        </h1>
        <h2 className="text-[2.3rem] md:text-[3.45rem] leading-tight font-bold mb-8 font-montserrat">
          <span className="text-[#FF6100]">Powered</span> by{" "}
          <span className="text-[#7289DA]">Discord</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12 font-montserrat">
          Launch your influencer marketing campaign in 24 hours
        </p>
        <div className="flex justify-center">
          <a href="/login">
            <Button className="bg-[#FF6100] hover:bg-[#FF6100]/90 h-12 px-8 font-montserrat font-bold">
              Get started for free
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Hero };