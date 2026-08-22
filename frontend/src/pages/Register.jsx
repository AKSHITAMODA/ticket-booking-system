import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {

  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      await register(
        name,
        email,
        password
      );

      navigate("/login", {
        state: {
          message:
            "Registration successful. Please login."
        }
      });

    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Registration failed"
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Logo */}

        <Link
          to="/"
          className="block text-center text-3xl font-black text-indigo-600 mb-8"
        >
          Ticketly
        </Link>

        {/* Card */}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              Create your account
            </h1>

            <p className="mt-2 text-slate-500">
              Join Ticketly and start booking events.
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Name */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Your name"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

            </div>

            {/* Email */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

            </div>

            {/* Password */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-7">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Login
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}