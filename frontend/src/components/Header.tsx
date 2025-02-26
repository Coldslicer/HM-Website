/* ================ [ IMPORTS ] ================ */

// React components
import React, { useState } from "react";

// UI components
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/Dialog";
import { Input } from "./ui/Input";

// Supabase client
import { supabase } from '../lib/supabase'; // Import Supabase client

/* ================ [ COMPONENT ] ================ */

// Header component
function Header() {
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async () => {
    // Validate email
    if (!email || !email.includes("@") || !email.includes(".")) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      // Insert email into Supabase `waitlist_users` table
      const { data, error } = await supabase
        .from("waitlist_users")
        .insert([{ email }]);

      if (error) {
        console.error("Supabase error:", error);
        alert("Failed to submit email. Please try again.");
      } else {
        console.log("Email added to waitlist:", email);
        alert("Email submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting email:", error);
      alert("An error occurred. Please try again.");
    }

    // Close the dialog and reset the email field
    setIsDialogOpen(false);
    setEmail("");
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF6100] hover:bg-[#FF6100]/90">Join Waitlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join the Waitlist</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Enter your email..."
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="bg-[#FF6100] hover:bg-[#FF6100]/90 w-full"
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Header };