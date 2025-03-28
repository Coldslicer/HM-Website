import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "../components/dashboard/Sidebar";
import Welcome from "./dashboard/Welcome";
import { BriefForm } from "./dashboard/BriefForm";
import Creators from "./dashboard/Creators";
import { Messaging } from "./dashboard/Messaging";
import Contract from "./dashboard/Contract";
import Timeline from "./dashboard/Timeline";
import Payment from "./dashboard/Payment";

export function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <Routes>
          <Route index element={<Navigate to="welcome" replace />} />

          <Route path="welcome" element={<Welcome />} />
          <Route path="brief" element={<BriefForm />} />
          <Route path="creators" element={<Creators />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="contract" element={<Contract />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="payment" element={<Payment />} />
        </Routes>
      </div>
    </div>
  );
}
