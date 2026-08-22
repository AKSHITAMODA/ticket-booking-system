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
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  // ================= LOAD RAZORPAY =================

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // ================= PAYMENT =================

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
    setPaymentLoading(true);
    setBookingMessage("");

    try {
      // -----------------------------------------
      // STEP 1: Load Razorpay
      // -----------------------------------------

      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection."
        );
      }

      // -----------------------------------------
      // STEP 2: Create order on backend
      // -----------------------------------------

      const orderResponse =
        await api.post(
          "/api/payments/create-order",
          {
            eventId: Number(id),
            numberOfSeats: tickets,
          }
        );

      const order = orderResponse.data;

      // -----------------------------------------
      // STEP 3: Open Razorpay Checkout
      // -----------------------------------------

      const options = {
        key: order.key,

        amount: order.amount,

        currency: order.currency,

        name: "Ticket Booking System",

        description: `${order.eventTitle} - ${order.numberOfSeats} ticket(s)`,

        order_id: order.orderId,

        prefill: {
          name: user.name || "",
          email: user.email || "",
        },

        theme: {
          color: "#4f46e5",
        },

        handler: async function (response) {
          try {
            // -----------------------------------
            // STEP 4: Verify payment on backend
            // -----------------------------------

            const verifyResponse =
              await api.post(
                "/api/payments/verify",
                {
                  razorpayOrderId:
                    response.razorpay_order_id,

                  razorpayPaymentId:
                    response.razorpay_payment_id,

                  razorpaySignature:
                    response.razorpay_signature,
                }
              );

            console.log(
              "Payment verified:",
              verifyResponse.data
            );

            // -----------------------------------
            // STEP 5: Update available seats
            // -----------------------------------

            setEvent((prev) => ({
              ...prev,
              availableSeats:
                prev.availableSeats - tickets,
            }));

            setBookingMessage(
              "Payment successful! Your booking is confirmed."
            );

            setTickets(1);

          } catch (err) {
            console.error(
              "Payment verification failed:",
              err
            );

            setBookingMessage(
              err.response?.data?.error ||
                "Payment verification failed."
            );
          } finally {
            setBooking(false);
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setBooking(false);
            setPaymentLoading(false);

            setBookingMessage(
              "Payment cancelled."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response
          );

          setBookingMessage(
            response.error?.description ||
              "Payment failed. Please try again."
          );

          setBooking(false);
          setPaymentLoading(false);
        }
      );

      razorpay.open();

    } catch (err) {
      console.error(
        "Payment order error:",
        err
      );

      setBookingMessage(
        err.response?.data?.error ||
          err.message ||
          "Unable to start payment."
      );

      setBooking(false);
      setPaymentLoading(false);
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

  const formattedDate =
    new Date(event.eventDate).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const formattedDateTime =
    new Date(event.eventDate).toLocaleString(
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

      {/* HERO */}

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

      {/* CONTENT */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT */}

          <div className="lg:col-span-2 space-y-8">

            {/* ABOUT */}

            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl">
                  ✨
                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                    Experience
                  </p>

                  <h2 className="text-2xl font-black">
                    About this event
                  </h2>

                </div>
              </div>

              <p className="mt-7 text-slate-600 dark:text-slate-300 leading-8">
                {event.description ||
                  "Join us for an unforgettable experience."}
              </p>

            </section>

            {/* EVENT DETAILS */}

            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-xl">
                  📋
                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400">
                    Information
                  </p>

                  <h2 className="text-2xl font-black">
                    Event Details
                  </h2>

                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    📍
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Venue
                  </p>

                  <p className="mt-1 font-bold">
                    {event.venue}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    📅
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date & Time
                  </p>

                  <p className="mt-1 font-bold">
                    {formattedDateTime}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    🪑
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total Capacity
                  </p>

                  <p className="mt-1 font-bold">
                    {event.totalSeats} seats
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    🎫
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Availability
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      event.availableSeats > 0
                        ? "text-emerald-600"
                        : "text-red-500"
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
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm">

                <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                  The organiser
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Organised by
                </h2>

                <div className="mt-6 flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                    {event.organiser.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div>

                    <p className="font-bold text-lg">
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

          {/* BOOKING */}

          <aside>

            <div className="lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-7">

              <p className="text-sm font-semibold text-slate-400">
                Ticket price
              </p>

              <div className="flex items-end gap-2 mt-1">

                <span className="text-4xl font-black">
                  ₹{event.price}
                </span>

                <span className="pb-1 text-sm text-slate-400">
                  / ticket
                </span>

              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-7" />

              <div className="flex items-center justify-between mb-5">

                <span className="text-sm font-semibold">
                  Availability
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  {event.availableSeats > 0
                    ? `${event.availableSeats} left`
                    : "Sold out"}
                </span>

              </div>

              {/* TICKETS */}

              <label className="block text-sm font-bold mb-3">
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
                  className="w-14 h-full text-2xl hover:bg-white dark:hover:bg-slate-700"
                >
                  −
                </button>

                <div className="flex-1 text-center text-lg font-black">
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
                  className="w-14 h-full text-2xl hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  +
                </button>

              </div>

              {/* PRICE */}

              <div className="mt-7 space-y-4">

                <div className="flex justify-between text-sm text-slate-500">

                  <span>
                    {tickets} × ₹{event.price}
                  </span>

                  <span>
                    ₹{totalPrice.toFixed(2)}
                  </span>

                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                <div className="flex justify-between items-center">

                  <span className="font-bold">
                    Total
                  </span>

                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    ₹{totalPrice.toFixed(2)}
                  </span>

                </div>

              </div>

              {/* PAYMENT BUTTON */}

              {event.availableSeats === 0 ? (

                <button
                  disabled
                  className="w-full mt-7 py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold"
                >
                  Sold Out
                </button>

              ) : (

                <button
                  onClick={handleBooking}
                  disabled={
                    booking ||
                    paymentLoading
                  }
                  className="w-full mt-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentLoading
                    ? "Opening Payment..."
                    : user
                      ? "💳 Pay & Book Tickets"
                      : "Login to Book"}
                </button>

              )}

              {/* MESSAGE */}

              {bookingMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold ${
                    bookingMessage.toLowerCase().includes(
                      "success"
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

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>🔒</span>
                  Secure Razorpay payment
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