/* ================ [ IMPORTS ] ================ */

// React components
import { useEffect } from "react";

// Components
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TesterApplication } from "../components/TesterApplication";

/* ================ [ COMPONENT ] ================ */

// BetaTest component
function BetaTest() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".fade-in").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32">
        <div className="fade-in">
          <TesterApplication />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export { BetaTest };
