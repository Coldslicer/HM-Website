import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "../components/dashboard/Sidebar";
import { WelcomePage } from "./dashboard/Welcome";
import { BriefForm } from "./dashboard/BriefForm";
import { CreatorSelection } from "./dashboard/CreatorSelection";
import { Messaging } from "./dashboard/Messaging";
import { Contract } from "./dashboard/Contract";
import { CreatorTimeline } from "./dashboard/Timeline";
import Payment from "./dashboard/Payment";

export function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <Routes>
          <Route index element={<Navigate to="welcome" replace />} />
          <Route path="brief" element={<BriefForm />} />
          <Route path="welcome" element={<WelcomePage />} />

          {<Route path="creators" element={<CreatorSelection />} />}
          <Route path="messaging" element={<Messaging />} />
          <Route path="contract" element={<Contract />} />
          <Route path="timeline" element={<CreatorTimeline />} />
          <Route path="payment" element={<Payment />} />
        </Routes>
      </div>
    </div>
  );
}
