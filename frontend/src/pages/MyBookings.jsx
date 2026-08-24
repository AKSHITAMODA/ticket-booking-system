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

  const [waitlist, setWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [waitlistError, setWaitlistError] = useState("");

  const [payingWaitlistId, setPayingWaitlistId] = useState(null);

  // =========================================================
  // LOAD BOOKINGS + WAITLIST
  // =========================================================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [
          bookingsResponse,
          waitlistResponse
        ] = await Promise.all([
          api.get("/api/bookings/my"),
          api.get("/api/waitlist/my")
        ]);

        setBookings(bookingsResponse.data);
        setWaitlist(waitlistResponse.data);

      } catch (err) {
        console.error(
          "Failed to load bookings/waitlist:",
          err
        );

        setError(
          err.response?.data?.error ||
          "Unable to load your bookings."
        );

        setWaitlistError(
          err.response?.data?.error ||
          "Unable to load your waitlist."
        );

      } finally {
        setLoading(false);
        setWaitlistLoading(false);
      }
    };

    fetchData();

  }, [user, authLoading, navigate]);

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  const handleCancel = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

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
      console.error("Cancellation error:", err);

      setError(
        err.response?.data?.error ||
        "Unable to cancel booking."
      );

    } finally {
      setCancellingId(null);
    }
  };

  // =========================================================
  // CANCEL WAITLIST
  // =========================================================

  const handleCancelWaitlist = async (entryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this waitlist?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/api/waitlist/${entryId}`
      );

      setWaitlist((previous) =>
        previous.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                status: "CANCELLED",
                offeredSeat: null,
              }
            : entry
        )
      );

      setMessage(
        "Waitlist entry cancelled successfully."
      );

    } catch (err) {
      console.error(
        "Waitlist cancellation error:",
        err
      );

      setError(
        err.response?.data?.error ||
        "Unable to cancel waitlist entry."
      );
    }
  };

  // =========================================================
  // ACCEPT WAITLIST OFFER + PAYMENT
  // =========================================================

  const handleWaitlistPayment = async (entry) => {
    if (!entry || entry.status !== "OFFERED") {
      return;
    }

    if (!entry.offeredSeat) {
      setError(
        "No seat has been offered for this waitlist entry."
      );
      return;
    }

    setPayingWaitlistId(entry.id);
    setMessage("");
    setError("");

    try {
      // -----------------------------------------------------
      // STEP 1: Accept the offered seat
      // -----------------------------------------------------

      const acceptResponse =
        await api.post(
          `/api/payments/waitlist/${entry.id}/accept`
        );

      const accepted =
        acceptResponse.data;

      const eventId =
        accepted.eventId ||
        entry.eventId;

      const seatId =
        accepted.seatId ||
        entry.offeredSeat.id;

      if (!eventId || !seatId) {
        throw new Error(
          "Invalid offered seat information."
        );
      }

      // -----------------------------------------------------
      // STEP 2: Create Razorpay payment order
      // -----------------------------------------------------

      const orderResponse =
        await api.post(
          "/api/payments/create-order",
          {
            eventId,
            seatIds: [seatId],
          }
        );

      const order =
        orderResponse.data;

      if (!order?.orderId) {
        throw new Error(
          "Unable to create payment order."
        );
      }

      // -----------------------------------------------------
      // STEP 3: Make sure Razorpay is available
      // -----------------------------------------------------

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay checkout is not available. Please refresh the page and try again."
        );
      }

      // -----------------------------------------------------
      // STEP 4: Open Razorpay
      // -----------------------------------------------------

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Ticketly",
        description:
          entry.eventTitle ||
          "Ticket Booking",

        order_id: order.orderId,

        handler: async function (response) {
          try {
            // -----------------------------------------------
            // STEP 5: Verify payment
            // -----------------------------------------------

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

            // -----------------------------------------------
            // STEP 6: Update UI
            // -----------------------------------------------

            setWaitlist((previous) =>
              previous.map((item) =>
                item.id === entry.id
                  ? {
                      ...item,
                      status: "FULFILLED",
                      offeredSeat: null,
                      offerExpiresAt: null,
                    }
                  : item
              )
            );

            setMessage(
              verifyResponse.data?.message ||
              "Payment successful. Your ticket has been booked."
            );

            // -----------------------------------------------
            // STEP 7: Refresh bookings
            // -----------------------------------------------

            try {
              const bookingsResponse =
                await api.get(
                  "/api/bookings/my"
                );

              setBookings(
                bookingsResponse.data
              );
            } catch (refreshError) {
              console.error(
                "Unable to refresh bookings:",
                refreshError
              );
            }

          } catch (verifyError) {
            console.error(
              "Payment verification error:",
              verifyError
            );

            setError(
              verifyError.response?.data?.error ||
              verifyError.message ||
              "Payment verification failed."
            );
          } finally {
            setPayingWaitlistId(null);
          }
        },

        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: function () {
            setPayingWaitlistId(null);

            setMessage(
              "Payment window closed. Your offered seat is still held until the offer expires."
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
            "Razorpay payment failed:",
            response
          );

          setError(
            response.error?.description ||
            "Payment failed. Please try again."
          );

          setPayingWaitlistId(null);
        }
      );

      razorpay.open();

    } catch (err) {
      console.error(
        "Waitlist payment error:",
        err
      );

      setError(
        err.response?.data?.error ||
        err.message ||
        "Unable to start payment."
      );

      setPayingWaitlistId(null);
    }
  };

  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Navbar />

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="animate-pulse space-y-5">

            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />

            <div className="h-5 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />

            <div className="mt-10 h-48 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />

          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <Navbar />

        <section className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950">

          <div className="max-w-7xl mx-auto px-6 py-14">

            <div className="animate-pulse">

              <div className="h-4 w-32 bg-white/20 rounded" />

              <div className="mt-4 h-12 w-72 bg-white/20 rounded-xl" />

              <div className="mt-4 h-5 w-96 max-w-full bg-white/20 rounded" />

            </div>

          </div>

        </section>

        <main className="max-w-7xl mx-auto px-6 py-12">

          <div className="space-y-6">

            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}

          </div>

        </main>

      </div>
    );
  }

  // =========================================================
  // STATS
  // =========================================================

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED"
    ).length;

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CANCELLED"
    ).length;

  const totalTickets =
    bookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.numberOfSeats || 0
        ),
      0
    );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />

      {/* ================= HEADER ================= */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white">

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">

          <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">
            Your tickets
          </p>

          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">
            My Bookings
          </h1>

          <p className="mt-4 text-indigo-100 text-lg max-w-xl">
            Keep track of your upcoming experiences,
            tickets and reservations.
          </p>

        </div>

      </section>

      {/* ================= CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">

          {/* TOTAL */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-400">
                  Total Bookings
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  {bookings.length}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-2xl">
                🎟️
              </div>

            </div>

          </div>

          {/* CONFIRMED */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-400">
                  Confirmed
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {confirmedBookings}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-2xl">
                ✓
              </div>

            </div>

          </div>

          {/* TICKETS */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-400">
                  Tickets Booked
                </p>

                <p className="mt-2 text-3xl font-black text-purple-600 dark:text-purple-400">
                  {totalTickets}
                </p>

              </div>

              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-2xl">
                🎫
              </div>

            </div>

          </div>

        </div>

        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-4 text-emerald-700 dark:text-emerald-400 font-semibold">

            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
              ✓
            </span>

            {message}

          </div>
        )}

        {/* ================= ERROR ================= */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-5 py-4 text-red-700 dark:text-red-400 font-semibold">

            <span>⚠️</span>

            {error}

          </div>
        )}

        {/* ================= EMPTY ================= */}

        {bookings.length === 0 ? (

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 md:p-20 text-center transition-colors">

            <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-4xl">
              🎟️
            </div>

            <h2 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">
              No bookings yet
            </h2>

            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You haven't booked any events yet.
              Discover something exciting and reserve
              your tickets today.
            </p>

            <button
              onClick={() => navigate("/events")}
              className="mt-7 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              Explore Events →
            </button>

          </div>

        ) : (

          <div>

            <div className="flex items-end justify-between mb-6">

              <div>

                <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Reservations
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  Your tickets
                </h2>

              </div>

              {cancelledBookings > 0 && (
                <p className="text-sm text-slate-400">
                  {cancelledBookings} cancelled
                </p>
              )}

            </div>

            <div className="space-y-6">

              {bookings.map((booking) => {

                const isConfirmed =
                  booking.status === "CONFIRMED";

                const eventDate =
                  new Date(
                    booking.event.eventDate
                  );

                return (

                  <article
                    key={booking.id}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300"
                  >

                    {/* ================= TOP ================= */}

                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-6 md:px-8 py-6">

                      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div>

                          <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider">
                            Booking #{booking.id}
                          </p>

                          <h2 className="mt-2 text-2xl md:text-3xl font-black text-white">
                            {booking.event.title}
                          </h2>

                        </div>

                        <span
                          className={`self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                            isConfirmed
                              ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400"
                          }`}
                        >

                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConfirmed
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />

                          {booking.status}

                        </span>

                      </div>

                    </div>

                    {/* ================= DETAILS ================= */}

                    <div className="p-6 md:p-8">

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* VENUE */}

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 transition-colors">

                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
                            📍
                          </div>

                          <p className="mt-4 text-xs uppercase tracking-wide font-bold text-slate-400">
                            Venue
                          </p>

                          <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">
                            {booking.event.venue}
                          </p>

                        </div>

                        {/* DATE */}

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 transition-colors">

                          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center">
                            📅
                          </div>

                          <p className="mt-4 text-xs uppercase tracking-wide font-bold text-slate-400">
                            Event Date
                          </p>

                          <p className="mt-1 font-bold text-slate-900 dark:text-white">

                            {eventDate.toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}

                          </p>

                        </div>

                        {/* TICKETS */}

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 transition-colors">

                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                            🎫
                          </div>

                          <p className="mt-4 text-xs uppercase tracking-wide font-bold text-slate-400">
                            Tickets
                          </p>

                          <p className="mt-1 font-bold text-slate-900 dark:text-white">

                            {booking.numberOfSeats}{" "}
                            {booking.numberOfSeats === 1
                              ? "ticket"
                              : "tickets"}

                          </p>

                        </div>

                        {/* AMOUNT */}

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-5 transition-colors">

                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                            ₹
                          </div>

                          <p className="mt-4 text-xs uppercase tracking-wide font-bold text-slate-400">
                            Total Amount
                          </p>

                          <p className="mt-1 font-black text-slate-900 dark:text-white">

                            ₹
                            {Number(
                              booking.totalAmount
                            ).toFixed(2)}

                          </p>

                        </div>

                      </div>

                      {/* ================= FOOTER ================= */}

                      <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                        <div>

                          <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                            Booked on
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">

                            {new Date(
                              booking.createdAt
                            ).toLocaleString("en-IN")}

                          </p>

                        </div>

                        <div className="flex flex-wrap gap-3">

                          <button
                            onClick={() =>
                              navigate(
                                `/events/${booking.event.id}`
                              )
                            }
                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            View Event
                          </button>

                          {isConfirmed && (
                            <button
                              onClick={() =>
                                handleCancel(
                                  booking.id
                                )
                              }
                              disabled={
                                cancellingId ===
                                booking.id
                              }
                              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {cancellingId ===
                              booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          )}

                        </div>

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>

          </div>

        )}

        {/* ================= WAITLIST ================= */}

        <section className="mt-14">

          <div className="flex items-end justify-between mb-6">

            <div>

              <p className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Waitlist
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Your waitlists
              </h2>

            </div>

            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-sm font-bold">

              {
                waitlist.filter(
                  (entry) =>
                    entry.status === "WAITING" ||
                    entry.status === "OFFERED"
                ).length
              } active

            </span>

          </div>

          {waitlistError && (
            <div className="mb-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 text-red-600 dark:text-red-400 font-semibold">
              {waitlistError}
            </div>
          )}

          {waitlistLoading ? (

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center animate-pulse">

              <div className="mx-auto h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />

              <div className="mx-auto mt-3 h-4 w-72 max-w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />

            </div>

          ) : waitlist.length === 0 ? (

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center">

              <div className="text-4xl">
                ⏳
              </div>

              <h3 className="mt-4 text-xl font-black">
                No waitlist entries
              </h3>

              <p className="mt-2 text-slate-500">
                You haven't joined any event waitlists.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {waitlist.map((entry) => {

                const active =
                  entry.status === "WAITING" ||
                  entry.status === "OFFERED";

                const isOffered =
                  entry.status === "OFFERED";

                const isPaying =
                  payingWaitlistId === entry.id;

                return (

                  <article
                    key={entry.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm p-6 ${
                      isOffered
                        ? "border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-900"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                      <div>

                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                          Waitlist #{entry.id}
                        </p>

                        <h3 className="mt-2 text-xl font-black">
                          {entry.eventTitle}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-3">

                          <span className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                            {entry.category}
                          </span>

                          <span className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-sm font-bold">
                            Position #{entry.position}
                          </span>

                          <span
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                              entry.status === "WAITING"
                                ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                                : entry.status === "OFFERED"
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                : entry.status === "FULFILLED"
                                ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {entry.status}
                          </span>

                        </div>

                        {/* OFFER MESSAGE */}

                        {isOffered &&
                          entry.offerExpiresAt && (
                            <div className="mt-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">

                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                🎟️ A seat has been offered to you!
                              </p>

                              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
                                Complete payment before the offer expires.
                              </p>

                              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                                Offer expires at{" "}
                                {new Date(
                                  entry.offerExpiresAt
                                ).toLocaleString("en-IN")}
                              </p>

                            </div>
                          )}

                        {/* OFFERED SEAT */}

                        {entry.offeredSeat && (
                          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">

                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              🎫 Offered seat:
                            </span>

                            <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                              {entry.offeredSeat.seatNumber}
                            </span>

                          </div>
                        )}

                      </div>

                      {/* ================= ACTIONS ================= */}

                      <div className="flex flex-wrap gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/events/${entry.eventId}`
                            )
                          }
                          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          View Event
                        </button>

                        {/* ACCEPT & PAY */}

                        {isOffered && (
                          <button
                            type="button"
                            onClick={() =>
                              handleWaitlistPayment(
                                entry
                              )
                            }
                            disabled={
                              isPaying
                            }
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 dark:shadow-emerald-950/30"
                          >

                            {isPaying
                              ? "Opening Payment..."
                              : "Accept & Pay"}

                          </button>
                        )}

                        {/* LEAVE WAITLIST */}

                        {active && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelWaitlist(
                                entry.id
                              )
                            }
                            disabled={isPaying}
                            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Leave Waitlist
                          </button>
                        )}

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}