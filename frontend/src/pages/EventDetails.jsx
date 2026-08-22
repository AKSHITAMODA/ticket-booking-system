import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tickets, setTickets] = useState(1);
  const [booking, setBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  // ================= FETCH EVENT =================

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/events/${id}`);
        setEvent(response.data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.error ||
            "Unable to load event"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // ================= BOOKING =================

  const handleBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (tickets < 1) {
      setBookingMessage(
        "Please select at least 1 ticket."
      );
      return;
    }

    if (tickets > event.availableSeats) {
      setBookingMessage(
        "Not enough seats available."
      );
      return;
    }

    setBooking(true);
    setBookingMessage("");

    try {
      const response = await api.post(
        "/api/bookings",
        {
          eventId: Number(id),
          numberOfSeats: tickets,
        }
      );

      console.log(
        "Booking successful:",
        response.data
      );

      setEvent((prev) => ({
        ...prev,
        availableSeats:
          prev.availableSeats - tickets,
      }));

      setBookingMessage(
        "Booking confirmed successfully!"
      );

      setTickets(1);

    } catch (err) {
      console.error(
        "Booking error:",
        err
      );

      setBookingMessage(
        err.response?.data?.error ||
          "Booking failed. Please try again."
      );

    } finally {
      setBooking(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="animate-pulse">

            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />

            <div className="mt-8 h-14 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />

            <div className="mt-4 h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />

            <div className="mt-12 grid lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />

              <div className="h-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />

            </div>

          </div>

        </div>

      </div>
    );
  }

  // ================= ERROR =================

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <Navbar />

        <div className="max-w-4xl mx-auto px-6 py-24">

          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl p-10 text-center shadow-sm">

            <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-4xl">
              🎫
            </div>

            <h2 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">
              Event not found
            </h2>

            <p className="mt-3 text-slate-500 dark:text-slate-400">
              {error || "This event does not exist."}
            </p>

            <button
              onClick={() => navigate("/events")}
              className="mt-7 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
            >
              ← Back to Events
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ================= PRICE =================

  const totalPrice =
    Number(event.price) * tickets;

  const formattedDate = new Date(
    event.eventDate
  ).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const formattedDateTime = new Date(
    event.eventDate
  ).toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );

  // ================= PAGE =================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white">

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">

          <button
            onClick={() => navigate("/events")}
            className="inline-flex items-center gap-2 text-white/75 hover:text-white font-medium transition"
          >
            ← Back to events
          </button>

          <div className="mt-10 grid lg:grid-cols-3 gap-10 items-end">

            {/* EVENT TITLE */}

            <div className="lg:col-span-2">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
                🎟️ Upcoming Event
              </div>

              <p className="mt-6 text-indigo-200 font-semibold">
                {formattedDate}
              </p>

              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                {event.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-indigo-100">

                <span className="flex items-center gap-2">
                  📍 {event.venue}
                </span>

                <span className="flex items-center gap-2">
                  🕐 {formattedDateTime}
                </span>

              </div>

            </div>

            {/* PRICE */}

            <div className="lg:text-right">

              <p className="text-sm text-indigo-200">
                Tickets from
              </p>

              <p className="mt-1 text-4xl font-black">
                ₹{event.price}
              </p>

              <p className="mt-1 text-sm text-indigo-200">
                per ticket
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ================= LEFT ================= */}

          <div className="lg:col-span-2 space-y-8">

            {/* ABOUT */}

            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm transition-colors">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl">
                  ✨
                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                    Experience
                  </p>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    About this event
                  </h2>

                </div>

              </div>

              <p className="mt-7 text-slate-600 dark:text-slate-300 leading-8 text-base">
                {event.description ||
                  "Join us for an unforgettable experience."}
              </p>

            </section>


            {/* EVENT DETAILS */}

            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm transition-colors">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-xl">
                  📋
                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400">
                    Information
                  </p>

                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Event Details
                  </h2>

                </div>

              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">

                {/* VENUE */}

                <div className="group rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition">

                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    📍
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Venue
                  </p>

                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {event.venue}
                  </p>

                </div>


                {/* DATE */}

                <div className="group rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition">

                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    📅
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Date & Time
                  </p>

                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {formattedDateTime}
                  </p>

                </div>


                {/* TOTAL SEATS */}

                <div className="group rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition">

                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    🪑
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Total Capacity
                  </p>

                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {event.totalSeats} seats
                  </p>

                </div>


                {/* AVAILABLE */}

                <div className="group rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition">

                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    🎫
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Availability
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      event.availableSeats > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {event.availableSeats > 0
                      ? `${event.availableSeats} seats available`
                      : "Sold out"}
                  </p>

                </div>

              </div>

            </section>


            {/* ORGANISER */}

            {event.organiser && (
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm transition-colors">

                <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                  The organiser
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  Organised by
                </h2>

                <div className="mt-6 flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100 dark:shadow-indigo-950/40">
                    {event.organiser.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div>

                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {event.organiser.name}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {event.organiser.email}
                    </p>

                  </div>

                </div>

              </section>
            )}

          </div>


          {/* ================= BOOKING ================= */}

          <aside>

            <div className="lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/30 p-7 transition-colors">

              {/* BOOKING HEADER */}

              <div>

                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Ticket price
                </p>

                <div className="flex items-end gap-2 mt-1">

                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    ₹{event.price}
                  </span>

                  <span className="pb-1 text-sm text-slate-400">
                    / ticket
                  </span>

                </div>

              </div>


              <div className="h-px bg-slate-200 dark:bg-slate-800 my-7" />


              {/* AVAILABLE */}

              <div className="flex items-center justify-between mb-5">

                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Availability
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    event.availableSeats > 0
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                  }`}
                >
                  {event.availableSeats > 0
                    ? `${event.availableSeats} left`
                    : "Sold out"}
                </span>

              </div>


              {/* TICKET COUNT */}

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                Number of tickets
              </label>

              <div className="flex items-center h-14 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800">

                <button
                  type="button"
                  onClick={() =>
                    setTickets(
                      Math.max(1, tickets - 1)
                    )
                  }
                  className="w-14 h-full text-2xl font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition"
                >
                  −
                </button>

                <div className="flex-1 text-center text-lg font-black text-slate-900 dark:text-white">
                  {tickets}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTickets(
                      Math.min(
                        event.availableSeats,
                        tickets + 1
                      )
                    )
                  }
                  disabled={
                    tickets >= event.availableSeats
                  }
                  className="w-14 h-full text-2xl font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition disabled:opacity-30"
                >
                  +
                </button>

              </div>


              {/* PRICE SUMMARY */}

              <div className="mt-7 space-y-4">

                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">

                  <span>
                    {tickets} × ₹{event.price}
                  </span>

                  <span>
                    ₹{totalPrice.toFixed(2)}
                  </span>

                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                <div className="flex justify-between items-center">

                  <span className="font-bold text-slate-900 dark:text-white">
                    Total
                  </span>

                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ₹{totalPrice.toFixed(2)}
                  </span>

                </div>

              </div>


              {/* BOOK BUTTON */}

              {event.availableSeats === 0 ? (

                <button
                  disabled
                  className="w-full mt-7 py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-bold cursor-not-allowed"
                >
                  Sold Out
                </button>

              ) : (

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full mt-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking
                    ? "Processing..."
                    : user
                      ? "🎟️ Book Tickets"
                      : "Login to Book"}
                </button>

              )}


              {/* MESSAGE */}

              {bookingMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold ${
                    bookingMessage.includes(
                      "successfully"
                    )
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                  }`}
                >
                  {bookingMessage}
                </div>
              )}


              {/* TRUST */}

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <span>🔒</span>
                  Secure booking
                  <span>•</span>
                  Instant confirmation
                </div>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}