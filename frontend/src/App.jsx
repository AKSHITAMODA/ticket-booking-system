import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import MyBookings from "./pages/MyBookings";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import OrganiserBookings from "./pages/OrganiserBookings";
function Placeholder({ title }) {
  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16">

        <h1 className="text-4xl font-bold">
          {title}
        </h1>

        <p className="mt-4 text-slate-500">
          Page coming next.
        </p>

      </main>

    </div>
  );
}

function App() {

  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* HOME */}

          <Route
            path="/"
            element={<Home />}
          />

          {/* AUTH */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* EVENTS */}

          <Route
            path="/events"
            element={<Events />}
          />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />

          {/* BOOKINGS */}

          <Route
            path="/my-bookings"
            element={<MyBookings />}
          />

          {/* ORGANISER */}

          <Route
            path="/organiser/dashboard"
            element={<OrganiserDashboard />}
          />
          <Route
            path="/organiser/dashboard/bookings/:eventId"
            element={<OrganiserBookings />}
          />
        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;