import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithProvider } = useAuthStore();


  const navigate = useNavigate();

const handleSubmit = async () => {
  setLoading(true);
  try {
    if (isSignUp) {
      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }

    // Ensure the user is authenticated before navigating
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      navigate('/dashboard'); // Redirect to dashboard
    }
  } catch (error) {
    console.error(error);
  }
  setLoading(false);
};


  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-md shadow-md">
        <h2 className="text-2xl font-bold text-black mb-4 text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <div className="flex items-center justify-between">
            <button
              onClick={() => signInWithProvider('google')}
              className="w-[48%] text-center bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Sign in with Google
            </button>
            <button
              onClick={() => signInWithProvider('discord')}
              className="w-[48%] text-center bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Sign in with Discord
            </button>
          </div>
          <p className="text-center text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="text-orange-500" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
