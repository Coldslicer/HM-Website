/* ================ [ IMPORTS ] ================ */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CLIENT } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Lock, Mail, Eye, EyeOff, Check, LogIn } from "lucide-react";

/* ================ [ AUTHENTICATION ] ================ */

function Login() {
  // Helper functions
  const { signInWithEmail, signUpWithEmail, signInWithProvider } =
    useAuthStore();
  const navigate = useNavigate();

  // State variables
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Session persistence
  useEffect(() => {
    SUPABASE_CLIENT.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        navigate("/dashboard");
      }
    });
  }, [navigate, rememberMe]);

  // Handle form submission
  const handleSubmit = async () => {
    // Begin loading state
    setLoading(true);

    // Enforce terms agreement
    if (isSignUp && !agreeTerms) {
      alert("Please agree to the Terms of Service and Privacy Policy first");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);

        // Log IP address
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();

        await SUPABASE_CLIENT.from("tos_agreements").insert([
          { ip_address: ip },
        ]);
      } else {
        await signInWithEmail(email, password);
      }

      // User authentication
      SUPABASE_CLIENT.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          navigate("/dashboard");
        }
      });
    } catch (error) {
      console.error(error);
    }

    // Exit loading state
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] items-start pt-12 justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-7 rounded-2xl shadow-md">
        <div className="flex justify-center mb-5">
          <LogIn className="w-11 h-11 text-orange-500" />
        </div>

        <h2 className="text-xl font-bold text-black mb-5 text-center">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h2>

        {/* Google and Discord auth */}
        <div className="flex flex-col space-y-4 mb-5">
          <button
            onClick={async () => {
              if (isSignUp && !agreeTerms) {
                alert(
                  "Please agree to the Terms of Service and Privacy Policy first"
                );
                return;
              }
              await signInWithProvider("google");
            }}
            className="w-full h-11 flex items-center justify-center rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-6 h-6 mr-2"
            />
            <span className="text-gray-700 text-sm">Sign in with Google</span>
          </button>
          <button
            onClick={async () => {
              if (isSignUp && !agreeTerms) {
                alert(
                  "Please agree to the Terms of Service and Privacy Policy first"
                );
                return;
              }
              await signInWithProvider("discord");
            }}
            className="w-full h-11 flex items-center justify-center rounded-lg bg-white border border-gray-300 hover:bg-gray-100 transition"
          >
            <img
              src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d80db9971f10a9757c99_Symbol.svg"
              alt="Discord"
              className="w-6 h-6 mr-2"
            />
            <span className="text-gray-700 text-sm">Sign in with Discord</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative bg-white px-2 text-xs text-gray-500 font-medium">
            OR
          </div>
        </div>

        {/* Email input */}
        <div className="relative mb-4">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        {/* Password input */}
        <div className="relative mb-4">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm tracking-widest placeholder:tracking-normal placeholder:text-sm"
            style={{ letterSpacing: "0.1em" }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Remember me */}
        <div className="flex items-center mb-5">
          <button
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-5 h-5 flex items-center justify-center border rounded-md mr-2 transition ${
              rememberMe
                ? "bg-orange-500 border-orange-500"
                : "bg-white border-gray-300"
            }`}
          >
            {rememberMe && <Check className="w-4 h-4 text-white" />}
          </button>
          <span className="text-sm text-gray-700">Remember me</span>
        </div>

        {/* Terms agreement (sign up) */}
        {isSignUp && (
          <div className="flex items-start mb-5">
            <button
              onClick={() => setAgreeTerms(!agreeTerms)}
              className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border rounded-md mr-2 transition ${
                agreeTerms
                  ? "bg-orange-500 border-orange-500"
                  : "bg-white border-gray-300"
              }`}
            >
              {agreeTerms && <Check className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 text-sm text-gray-700">
              By creating an account, I acknowledge that I have read and agree
              to Warm's{" "}
              <a
                href="https://hotslicer.com/warmtos/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://hotslicer.com/warmprivacypolicy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mb-5 text-sm"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>

        {/* Sign up toggle */}
        <p className="text-center text-xs">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="text-orange-500"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Login;
