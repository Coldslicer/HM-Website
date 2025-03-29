import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPABASE_CLIENT } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Lock, Mail, Eye, EyeOff, Check, LogIn } from "lucide-react";

/* ================ [ LOGIN ] ================ */

function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithProvider } = useAuthStore();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Default to true in sign-up
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Error message state

  useEffect(() => {
    SUPABASE_CLIENT.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        useAuthStore.getState().setUser(user);
        navigate("/dashboard");
      }
    });
  }, [navigate, rememberMe]);

  const clearErrorMessage = () => {
    setTimeout(() => {
      setErrorMessage(""); // Clear error message after timeout
    }, 5000); // Clear after 5 seconds
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage(""); // Reset previous error messages

    if (isSignUp && !agreeTerms) {
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy to sign up.");
      clearErrorMessage(); // Clear after timeout
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setErrorMessage(error.message);
          clearErrorMessage();
          setLoading(false);
          return;
        }

        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();
        await SUPABASE_CLIENT.from("tos_agreements").insert([{ ip_address: ip }]);
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(error.message);
          clearErrorMessage();
          setLoading(false);
          return;
        }
      }

      const { data: { user }, error } = await SUPABASE_CLIENT.auth.getUser();
      if (user) {
        navigate("/dashboard");
      } else {
        setErrorMessage(error?.message || "An unknown error occurred.");
        clearErrorMessage();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage("An unexpected error occurred. Please try again later.");
      clearErrorMessage();
    }

    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] items-start pt-12 justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-7 rounded-2xl shadow-md overflow-hidden">
        <div className="flex justify-center mb-5">
          <LogIn className="w-11 h-11 text-orange-500" />
        </div>

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
            onClick={async () => {
              if (isSignUp && !agreeTerms) {
                setErrorMessage("You must agree to the Terms of Service and Privacy Policy first.");
                clearErrorMessage();
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
                setErrorMessage("You must agree to the Terms of Service and Privacy Policy first.");
                clearErrorMessage();
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

        {/* Remember me (only shown in Sign In mode) */}
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
          disabled={loading || (isSignUp && !agreeTerms)}
          className={`w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition mb-5 text-sm ${
            (isSignUp && !agreeTerms) ? "cursor-not-allowed opacity-50" : ""
          }`}
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

export default Login;
