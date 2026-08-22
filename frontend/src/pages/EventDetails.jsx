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

        const response = await api.get(
          `/api/events/${id}`
        );

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

      // Update available seats immediately
      setEvent((prev) => ({
        ...prev,
        availableSeats:
          prev.availableSeats - tickets,
      }));

      setBookingMessage(
        "Booking confirmed successfully!"
      );

      // Reset ticket count
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
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="flex justify-center items-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500">
              Loading event...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ================= ERROR =================

  if (error || !event) {

    return (
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="max-w-4xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">

            <h2 className="text-2xl font-bold text-red-700">
              Event not found
            </h2>

            <p className="mt-2 text-red-600">
              {error || "This event does not exist."}
            </p>

            <button
              onClick={() => navigate("/events")}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Back to Events
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ================= PRICE =================

  const totalPrice =
    Number(event.price) * tickets;

  // ================= PAGE =================

  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      {/* ================= HERO ================= */}

      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <button
            onClick={() => navigate("/events")}
            className="text-white/80 hover:text-white mb-8"
          >
            ← Back to events
          </button>

          <p className="text-indigo-100 font-medium">

            {new Date(
              event.eventDate
            ).toLocaleDateString(
              "en-IN",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}

          </p>

          <h1 className="text-5xl font-black text-white mt-3">
            {event.title}
          </h1>

          <p className="text-indigo-100 text-lg mt-4">
            {event.venue}
          </p>

        </div>

      </section>

      {/* ================= CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ================= EVENT INFORMATION ================= */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-2xl border border-slate-200 p-8">

              <h2 className="text-2xl font-bold text-slate-900">
                About this event
              </h2>

              <p className="mt-5 text-slate-600 leading-7">
                {event.description}
              </p>

              {/* EVENT DETAILS */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-400">
                    Venue
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">
                    📍 {event.venue}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-400">
                    Event Date
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">

                    📅{" "}
                    {new Date(
                      event.eventDate
                    ).toLocaleString("en-IN")}

                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-400">
                    Total Seats
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">
                    🪑 {event.totalSeats}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-400">
                    Available Seats
                  </p>

                  <p className="font-semibold text-green-600 mt-1">
                    {event.availableSeats} available
                  </p>

                </div>

              </div>

              {/* ================= ORGANISER ================= */}

              {event.organiser && (

                <div className="mt-8 pt-8 border-t border-slate-200">

                  <h3 className="font-bold text-lg">
                    Organised by
                  </h3>

                  <div className="mt-4 flex items-center gap-4">

                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">

                      {event.organiser.name
                        ?.charAt(0)
                        ?.toUpperCase()}

                    </div>

                    <div>

                      <p className="font-semibold">
                        {event.organiser.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {event.organiser.email}
                      </p>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* ================= BOOKING CARD ================= */}

          <div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sticky top-6">

              <p className="text-sm text-slate-400">
                Ticket price
              </p>

              <p className="text-4xl font-black text-slate-900 mt-1">
                ₹{event.price}
              </p>

              <div className="border-t border-slate-200 my-6" />

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Number of tickets
              </label>

              {/* TICKET COUNTER */}

              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">

                <button
                  type="button"
                  onClick={() =>
                    setTickets(
                      Math.max(
                        1,
                        tickets - 1
                      )
                    )
                  }
                  className="w-12 h-12 text-xl hover:bg-slate-50"
                >
                  −
                </button>

                <div className="flex-1 text-center font-bold">
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
                  className="w-12 h-12 text-xl hover:bg-slate-50"
                >
                  +
                </button>

              </div>

              {/* PRICE */}

              <div className="flex justify-between mt-6 text-slate-600">

                <span>
                  {tickets} × ₹{event.price}
                </span>

                <span className="font-semibold">
                  ₹{totalPrice.toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between mt-4 pt-4 border-t border-slate-200">

                <span className="font-bold text-lg">
                  Total
                </span>

                <span className="font-black text-xl">
                  ₹{totalPrice.toFixed(2)}
                </span>

              </div>

              {/* BOOK BUTTON */}

              {event.availableSeats === 0 ? (

                <button
                  disabled
                  className="w-full mt-6 py-3.5 rounded-xl bg-slate-300 text-slate-500 font-bold cursor-not-allowed"
                >
                  Sold Out
                </button>

              ) : (

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="w-full mt-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {booking
                    ? "Processing..."
                    : user
                      ? "Book Tickets"
                      : "Login to Book"}
                </button>

              )}

              {/* BOOKING MESSAGE */}

              {bookingMessage && (

                <p
                  className={`mt-4 text-center text-sm font-medium ${
                    bookingMessage.includes(
                      "successfully"
                    )
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {bookingMessage}
                </p>

              )}

              <p className="text-xs text-slate-400 text-center mt-5">
                Secure booking • Instant confirmation
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}