import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function MyBookings() {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState("");

  // ================= FETCH BOOKINGS =================

  useEffect(() => {

    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {

      try {

        const response = await api.get(
          "/api/bookings/my"
        );

        setBookings(response.data);

      } catch (err) {

        console.error(
          "Failed to load bookings:",
          err
        );

        setError(
          err.response?.data?.error ||
          "Unable to load your bookings."
        );

      } finally {

        setLoading(false);

      }
    };

    fetchBookings();

  }, [user, authLoading, navigate]);

  // ================= CANCEL BOOKING =================

  const handleCancel = async (bookingId) => {

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(bookingId);
    setMessage("");
    setError("");

    try {

      const response = await api.delete(
        `/api/bookings/${bookingId}`
      );

      setBookings((previousBookings) =>
        previousBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "CANCELLED",
              }
            : booking
        )
      );

      setMessage(
        response.data?.message ||
        "Booking cancelled successfully."
      );

    } catch (err) {

      console.error(
        "Cancellation error:",
        err
      );

      setError(
        err.response?.data?.error ||
        "Unable to cancel booking."
      );

    } finally {

      setCancellingId(null);

    }
  };

  // ================= AUTH LOADING =================

  if (authLoading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="flex justify-center items-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500">
              Checking authentication...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ================= PAGE LOADING =================

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="flex justify-center items-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500">
              Loading your bookings...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ================= PAGE =================

  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      {/* ================= HEADER ================= */}

      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700">

        <div className="max-w-7xl mx-auto px-6 py-14">

          <p className="text-indigo-100 font-medium">
            Your tickets
          </p>

          <h1 className="text-4xl md:text-5xl font-black text-white mt-2">
            My Bookings
          </h1>

          <p className="text-indigo-100 mt-4 text-lg">
            View and manage all your event bookings.
          </p>

        </div>

      </section>

      {/* ================= CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* MESSAGE */}

        {message && (

          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700 font-medium">
            {message}
          </div>

        )}

        {/* ERROR */}

        {error && (

          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>

        )}

        {/* ================= EMPTY ================= */}

        {bookings.length === 0 ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <div className="text-5xl">
              🎟️
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-5">
              No bookings yet
            </h2>

            <p className="text-slate-500 mt-2">
              You haven't booked any events yet.
            </p>

            <button
              onClick={() => navigate("/events")}
              className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
            >
              Explore Events
            </button>

          </div>

        ) : (

          <div className="space-y-6">

            {bookings.map((booking) => (

              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >

                {/* ================= BOOKING HEADER ================= */}

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div>

                      <p className="text-indigo-100 text-sm">
                        Booking #{booking.id}
                      </p>

                      <h2 className="text-2xl font-bold text-white mt-1">
                        {booking.event.title}
                      </h2>

                    </div>

                    <span
                      className={`self-start md:self-auto px-4 py-2 rounded-full text-sm font-bold ${
                        booking.status === "CONFIRMED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>

                  </div>

                </div>

                {/* ================= BOOKING DETAILS ================= */}

                <div className="p-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* VENUE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-sm text-slate-400">
                        Venue
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        📍 {booking.event.venue}
                      </p>

                    </div>

                    {/* EVENT DATE */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-sm text-slate-400">
                        Event Date
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        📅{" "}
                        {new Date(
                          booking.event.eventDate
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                    {/* TICKETS */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-sm text-slate-400">
                        Tickets
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        🎟️ {booking.numberOfSeats}
                      </p>

                    </div>

                    {/* AMOUNT */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-sm text-slate-400">
                        Total Amount
                      </p>

                      <p className="font-bold text-slate-900 mt-1">
                        ₹{Number(
                          booking.totalAmount
                        ).toFixed(2)}
                      </p>

                    </div>

                  </div>

                  {/* ================= FOOTER ================= */}

                  <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                      <p className="text-sm text-slate-400">
                        Booked on
                      </p>

                      <p className="text-sm font-medium text-slate-700 mt-1">
                        {new Date(
                          booking.createdAt
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                    <div className="flex gap-3">

                      <button
                        onClick={() =>
                          navigate(
                            `/events/${booking.event.id}`
                          )
                        }
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                      >
                        View Event
                      </button>

                      {booking.status === "CONFIRMED" && (

                        <button
                          onClick={() =>
                            handleCancel(booking.id)
                          }
                          disabled={
                            cancellingId === booking.id
                          }
                          className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {cancellingId === booking.id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}