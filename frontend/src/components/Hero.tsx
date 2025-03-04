/* ================ [ IMPORTS ] ================ */

// React components
import React, { useState } from "react";

// UI components
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

// Supabase client
import { supabase } from '../lib/supabase'; // Import Supabase client

/* ================ [ COMPONENT ] ================ */

// Hero component
function Hero() {
  const [email, setEmail] = useState("");

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

    // Reset the email field
    setEmail("");
  };

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
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Input
            placeholder="Enter your email..."
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 font-montserrat"
          />
          <Button
            className="bg-[#FF6100] hover:bg-[#FF6100]/90 h-12 px-8 font-montserrat font-bold"
            onClick={handleSubmit}
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Hero };