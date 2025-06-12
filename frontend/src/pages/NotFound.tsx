import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white px-4 text-center">
      <h1 className="text-5xl font-bold text-black mb-4">404 – Page Not Found</h1>
      <p className="text-lg text-black mb-8">
        The page you're looking for doesn’t exist or has been moved.
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded transition"
      >
        Return to Homepage
      </button>
    </div>
  );
}
