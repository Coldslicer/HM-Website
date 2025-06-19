/* ================ [ IMPORTS ] ================ */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "../components/dashboard/Sidebar";
import Welcome from "./dashboard/Welcome";
import { BriefForm } from "./dashboard/BriefForm";
import Creators from "./dashboard/Creators";
import { Messaging } from "./dashboard/Messaging";
import Contract from "./dashboard/Contract";
import Timeline from "./dashboard/Timeline";
import Analytics from "./dashboard/Analytics";
import Payment from "./dashboard/Payment";
import Contacts from "./dashboard/Contacts";

/* ================ [ DASHBOARD ] ================ */

function Dashboard() {
  // Navigate hook
  const navigate = useNavigate();

  /* ================ [ METHODS ] ================ */

  // Auto redirect if session doesn't exist
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/login");
    });
  }, [navigate]);

  /* ================ [ COMPONENT ] ================ */

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 pt-8 pl-72">
        <Routes>
          <Route index element={<Navigate to="welcome" replace />} />

          <Route path="welcome" element={<Welcome />} />
          <Route path="brief" element={<BriefForm />} />
          <Route path="creators" element={<Creators />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="contract" element={<Contract />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payment" element={<Payment />} />
          <Route path="contacts" element={<Contacts />} />
        </Routes>
      </div>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Dashboard;
