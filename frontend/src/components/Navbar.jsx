import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl transition-colors duration-300">

      <div className="max-w-7xl mx-auto px-6">

        <div className="h-20 flex items-center justify-between">

          {/* ================= LOGO ================= */}

          <Link
            to="/"
            className="flex items-center gap-3 group"
          >

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 group-hover:scale-105 transition">
              <span className="text-xl">
                🎟️
              </span>
            </div>

            <div>

              <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Ticket<span className="text-indigo-600">ly</span>
              </div>

              <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
                Event booking
              </div>

            </div>

          </Link>


          {/* ================= NAVIGATION ================= */}

          <div className="hidden md:flex items-center gap-2">

            <Link
              to="/events"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isActive("/events")
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              Explore Events
            </Link>


            {user && (
              <Link
                to="/my-bookings"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive("/my-bookings")
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                My Bookings
              </Link>
            )}


            {user?.role === "ORGANISER" && (
              <Link
                to="/organiser/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  location.pathname.startsWith("/organiser")
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                Organiser Dashboard
              </Link>
            )}

          </div>


          {/* ================= RIGHT SIDE ================= */}

          <div className="flex items-center gap-3">

            {/* ================= DARK MODE ================= */}

            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle dark mode"
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-center"
            >

              {darkMode ? (
                <span className="text-lg">
                  ☀️
                </span>
              ) : (
                <span className="text-lg">
                  🌙
                </span>
              )}

            </button>


            {/* ================= LOGGED OUT ================= */}

            {!user ? (

              <div className="flex items-center gap-3">

                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 hover:bg-indigo-700 hover:-translate-y-0.5 transition"
                >
                  Get Started
                </Link>

              </div>

            ) : (

              /* ================= LOGGED IN ================= */

              <div className="flex items-center gap-4">

                {/* User */}

                <div className="hidden sm:flex items-center gap-3">

                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="leading-tight">

                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {user.name}
                    </p>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {user.role === "ORGANISER"
                        ? "Event Organiser"
                        : "Ticketly Member"}
                    </p>

                  </div>

                </div>


                {/* Logout */}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  Logout
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </nav>
  );
}