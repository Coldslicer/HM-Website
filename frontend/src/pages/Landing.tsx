/* ================ [ IMPORTS ] ================ */

// React components
import React, { useEffect } from "react";

// Page components
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Showcase } from "../components/Showcase";
import { Features } from "../components/Features";
import { Brands } from "../components/Brands";
import { FAQ } from "../components/FAQ";
import { Footer } from "../components/Footer";

/* ================ [ COMPONENT ] ================ */

// Landing page
function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-in").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="fade-in">
          <Hero />
        </div>
        <div className="fade-in">
          <Showcase />
        </div>
        <div className="fade-in mt-8">
          <Features />
        </div>
        <div className="fade-in">
          <Brands />
        </div>
        <div className="fade-in">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Landing;
