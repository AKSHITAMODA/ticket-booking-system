import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import MyBookings from "./pages/MyBookings";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import OrganiserBookings from "./pages/OrganiserBookings";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter>

      <ThemeProvider>

        <AuthProvider>

          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

            {/* ================= PAGE CONTENT ================= */}

            <main className="flex-1">

              <Routes>

                {/* ================= HOME ================= */}

                <Route
                  path="/"
                  element={<Home />}
                />

                {/* ================= AUTH ================= */}

                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                {/* ================= EVENTS ================= */}

                <Route
                  path="/events"
                  element={<Events />}
                />

                <Route
                  path="/events/:id"
                  element={<EventDetails />}
                />

                {/* ================= BOOKINGS ================= */}

                <Route
                  path="/my-bookings"
                  element={<MyBookings />}
                />

                {/* ================= ORGANISER ================= */}

                <Route
                  path="/organiser/dashboard"
                  element={<OrganiserDashboard />}
                />

                <Route
                  path="/organiser/dashboard/bookings/:eventId"
                  element={<OrganiserBookings />}
                />

              </Routes>

            </main>

            {/* ================= FOOTER ================= */}

            <Footer />

          </div>

        </AuthProvider>

      </ThemeProvider>

    </BrowserRouter>
  );
}

export default App;