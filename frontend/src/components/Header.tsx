/* ================ [ IMPORTS ] ================ */

// UI components
import { Button } from "./ui/Button";

// Icons
import { ArrowRight } from "lucide-react";

/* ================ [ COMPONENT ] ================ */

// Header component
function Header() {
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-20%20at%205.02.14%E2%80%AFPM-7brHXsrclZ40qhkvVTtNWs1KrSPjHl.png"
            alt="Warm Logo"
            width={160}
            height={45}
            loading="eager"
          />
        </a>
        <nav className="hidden md:flex items-center justify-center flex-1 gap-6">
          <a href="/" className="text-sm font-medium">
            Home
          </a>
          <a href="/beta" className="text-sm font-medium">
            Beta Tester
          </a>
        </nav>
        <a href="/login">
          <Button className="bg-[#FF6100] hover:bg-[#FF6100]/90">
            Get started for free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>
    </header>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Header };