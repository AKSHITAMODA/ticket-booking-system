import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/events";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">

      {/* ================= LEFT VISUAL ================= */}

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white">

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">

          <Link
            to="/"
            className="flex items-center gap-3 w-fit"
          >

            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
              🎟️
            </div>

            <span className="text-2xl font-black">
              Ticket<span className="text-indigo-200">
                ly
              </span>
            </span>

          </Link>


          <div className="max-w-lg">

            <p className="text-indigo-200 font-bold text-sm uppercase tracking-wider">
              Welcome back
            </p>

            <h2 className="mt-4 text-5xl xl:text-6xl font-black leading-tight">

              Your next

              <span className="block text-indigo-200">
                experience awaits.
              </span>

            </h2>

            <p className="mt-6 text-lg text-indigo-100 leading-relaxed">
              Sign in to discover upcoming events,
              manage your bookings and never miss
              an experience worth remembering.
            </p>

          </div>


          <p className="text-sm text-indigo-200">
            © 2026 Akshita Moda
          </p>

        </div>

      </div>


      {/* ================= LOGIN ================= */}

      <div className="flex-1 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <Link
            to="/"
            className="lg:hidden flex items-center justify-center gap-2 mb-10"
          >

            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              🎟️
            </div>

            <span className="text-2xl font-black text-slate-900 dark:text-white">
              Ticket<span className="text-indigo-600">
                ly
              </span>
            </span>

          </Link>


          {/* HEADING */}

          <div className="mb-8">

            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Account access
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h1>

            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Sign in to continue your Ticketly journey.
            </p>

          </div>


          {/* CARD */}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/30 p-7 md:p-8 transition-colors">

            {error && (
              <div className="mb-6 flex gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-4 text-sm text-red-700 dark:text-red-400">

                <span>⚠️</span>

                <p>{error}</p>

              </div>
            )}


            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Email address
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ✉️
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Password
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔒
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                  />

                </div>

              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Signing you in..."
                  : "Sign In →"}
              </button>

            </form>


            <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  Create one
                </Link>

              </p>

            </div>

          </div>


          <p className="mt-7 text-center text-xs text-slate-400">
            Secure authentication • Ticketly
          </p>

        </div>

      </div>

    </div>
  );
}