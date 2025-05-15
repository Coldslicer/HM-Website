/* ================ [ IMPORTS ] ================ */

import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import { BetaTest } from "./pages/BetaTest";
import { CreatorForm } from "./pages/CreatorForm";
import Dashboard from "./pages/Dashboard";
import { Hero } from "./pages/Hero";
import { Landing } from "./pages/Landing";
import Login from "./pages/Login";
import { CreatorSharingPage } from "./pages/CreatorSharingPage";
import { CreatorContract } from "./pages/CreatorContract";

/* ================ [ APP ] ================ */

// App component
function App() {
  const pathsWithNavbar = ["/home", "/login", "/dashboard"];

  // Conditionally show navbar
  const showNavbar = pathsWithNavbar.some((path) =>
    useLocation().pathname.startsWith(path),
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {showNavbar && (
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/beta" element={<BetaTest />} />

        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<Dashboard />} />

        <Route path="/creator-form" element={<CreatorForm />} />
        <Route
          path="/creator-sharing/:campaignId"
          element={<CreatorSharingPage />}
        />

        <Route path="/creator-contract" element={<CreatorContract />} />

        <Route path="/home" element={<Hero />} />
      </Routes>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default App;
