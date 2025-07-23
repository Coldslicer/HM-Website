import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.ts";
import { useAuthStore } from "../../store/authStore.ts";
import { Check, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";

interface LoginComponentProps {
  redirectUrl?: string;
  onLoginSuccess?: (user: any) => void;
  className?: string;
}

function LoginComponent({
  redirectUrl = "/dashboard",
  onLoginSuccess,
  className = "",
}: LoginComponentProps) {
  // Navigate hook
  const navigate = useNavigate();

  // State variables
  const [isSignUp, setIsSignUp] = useState(false); // Sign up / sign in
  const [email, setEmail] = useState(""); // Email input
  const [password, setPassword] = useState(""); // Password input
  const [showPassword, setShowPassword] = useState(false); // Show / hide password
  const [rememberMe, setRememberMe] = useState(true); // Sesssion persistance
  const [agreeTerms, setAgreeTerms] = useState(false); // Agree to terms (sign up)
  const [errorMessage, setErrorMessage] = useState(""); // Error message

  /* ================ [ METHODS ] ================ */

  // Auto redirect if session exists
  useEffect(() => {
    // Check for user session
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();

      // Redirect to dashboard
      if (data?.user) {
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        } else {
          navigate(redirectUrl);
        }
      }
    };

    checkSession();
  }, [navigate, redirectUrl, onLoginSuccess]);

  // Display error message with timeout
  const displayError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage("");
    }, 5000); // Clear after 5 seconds
  };

  // Provider login handler
  const providerLogin = async (provider: "google" | "discord") => {
    // Get auth response
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
        skipBrowserRedirect: true,
      },
    });

    // Error handling
    if (error) {
      displayError(
        error.message || "An unknown error occurred, please try again later",
      );
      return;
    }

    // Redirect to dashboard
    if (data?.url) window.location.href = data.url;
  };

  // Email login handler
  const emailLogin = async () => {
    // Supabase response
    let response;

    // Sign up / sign in
    if (isSignUp) {
      response = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    // Unpack response
    const { data, error } = response;

    // Error handling
    if (error) {
      displayError(
        error.message || "An unknown error occurred, please try again later",
      );
      return;
    }

    // Session persistence
    useAuthStore.getState().setUser(data.user);
    localStorage.setItem("supabase_session", JSON.stringify(data.session));

    // Log IP address (sign up)
    if (isSignUp) {
      const ip = await (
        await fetch("https://api.ipify.org?format=json")
      ).json();
      await supabase.from("tos_agreements").insert([{ ip_address: ip }]);
    }
  };

  // Submit handler
  const handleSubmit = async (_event: any, provider?: "google" | "discord") => {
    // Reset error message
    setErrorMessage("");

    // Terms confirmation (sign up)
    if (isSignUp && !agreeTerms) {
      displayError(
        "Please agree to the Terms of Service and Privacy Policy first",
      );
      return;
    }

    // Login logic
    try {
      if (provider) await providerLogin(provider);
      else await emailLogin();

      // Check user session
      const { data, error } = await supabase.auth.getUser();

      // Handle successful login
      if (data.user) {
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        } else {
          navigate(redirectUrl);
        }
      }

      // Error handling
      if (error) {
        displayError(
          error.message || "An unknown error occurred, please try again later",
        );
        return;
      }
    } catch (error) {
      displayError("An unexpected error occurred, please try again later");
      console.error("Unexpected error:", error);
    }
  };

  /* ================ [ COMPONENT ] ================ */

  return (
    <div
      className={`w-full max-w-sm bg-white p-7 rounded-2xl shadow-md overflow-hidden ${className}`}
    >
      {/* Login icon */}
      <div className="flex justify-center mb-5">
        <LogIn className="w-11 h-11 text-orange-500" />
      </div>

      {/* Login title */}
      <h2 className="text-xl font-bold text-black mb-5 text-center">
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 text-sm text-red-500 text-center">
          {errorMessage}
        </div>
      )}

      {/* Google and Discord auth */}
      <div className="flex flex-col space-y-4 mb-5">
        <button
          onClick={(e) => handleSubmit(e, "google")}
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
          onClick={(e) => handleSubmit(e, "discord")}
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
          required
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
          required
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

      {/* Remember me (sign in) */}
      {!isSignUp && (
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
      )}

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
            By creating an account, I acknowledge that I have read and agree to
            Warm's{" "}
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
              href="https://hotslicer.com/warmprivacypolicy/"
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
        className={
          "w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mb-5 text-sm"
        }
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
  );
}

export default LoginComponent;
