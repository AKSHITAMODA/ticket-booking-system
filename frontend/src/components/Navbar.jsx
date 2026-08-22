import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600"
        >
          Ticketly
        </Link>

        <div className="flex items-center gap-6">

          <Link
            to="/"
            className="text-slate-600 hover:text-indigo-600"
          >
            Events
          </Link>

          {user && (
            <Link
              to="/my-bookings"
              className="text-slate-600 hover:text-indigo-600"
            >
              My Bookings
            </Link>
          )}

          {user?.role === "ORGANISER" && (
            <Link
              to="/organiser/dashboard"
              className="text-slate-600 hover:text-indigo-600"
            >
              Organiser
            </Link>
          )}

          {!user ? (
            <div className="flex items-center gap-3">

              <Link
                to="/login"
                className="px-4 py-2 text-slate-700 hover:text-indigo-600"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Register
              </Link>

            </div>
          ) : (
            <div className="flex items-center gap-4">

              <span className="text-sm text-slate-600">
                Hi, {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </nav>
  );
}