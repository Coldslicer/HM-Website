/* ================ [ IMPORTS ] ================ */

import { useNavigate } from "react-router-dom";
import LoginComponent from "../components/dashboard/LoginComponent.tsx";

/* ================ [ LOGIN ] ================ */

function Login() {
  const navigate = useNavigate();

  // Handle successful login
  const handleLoginSuccess = (user: any) => {
    navigate("/dashboard");
  };

  /* ================ [ COMPONENT ] ================ */

  return (
    <div className="flex h-[calc(100vh-4rem)] items-start pt-12 justify-center bg-gray-100 p-4">
      <LoginComponent 
        redirectUrl="/dashboard"
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default Login;
