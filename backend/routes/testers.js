/* ================ [ APPLICATIONS ] ================ */

// Imports
import express from "express";
import { SUPABASE_CLIENT } from "../util/setup.js";

// Router
const ROUTER = express.Router();

// Post submit email
ROUTER.post("/submit-email", async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Insert email into Supabase `waitlist_users` table
    const { data, error } = await SUPABASE_CLIENT
      .from("waitlist_users")
      .insert([{ email }]);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to submit email" });
    }

    console.log("Email added to waitlist:", email);
    res.status(200).json({ message: "Email submitted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Post submit tester application
ROUTER.post("/submit-tester-application", async (req, res) => {
  const { name, channel_name, channel_link, deliverables, deliverables_rate, agreed } = req.body;

  // Validate required fields
  if (!name || !channel_name || !channel_link || !deliverables || !deliverables_rate || agreed === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Insert data into Supabase `tester_applications` table
    const { data, error } = await SUPABASE_CLIENT
      .from("tester_applications")
      .insert([{ name, channel_name, channel_link, deliverables, deliverables_rate, agreed }]);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to submit tester application" });
    }

    console.log("Tester application submitted:", name);
    res.status(200).json({ message: "Tester application submitted successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export router
export default ROUTER;