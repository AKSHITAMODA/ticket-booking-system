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
  const [seats, setSeats] = useState([]);

  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [booking, setBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // =========================================================
  // HOLD STATE
  // =========================================================

  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [holdLoading, setHoldLoading] = useState(false);

  // =========================================================
  // WAITLIST STATE
  // =========================================================

  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState(null);
  const [waitlistMessage, setWaitlistMessage] = useState("");

  // Seat-map availability is the source of truth for the UI.
  // event.availableSeats can become stale after a booking/hold transition.
  const actualAvailableSeats = seats.filter(
    (seat) => seat.status === "AVAILABLE"
  ).length;

  // =========================================================
  // FETCH EVENT + SEATS
  // =========================================================

  const fetchEventAndSeats = async () => {
    try {
      const eventResponse =
        await api.get(`/api/events/${id}`);

      setEvent(eventResponse.data);

      const seatsResponse =
        await api.get(`/api/events/${id}/seats`);

      setSeats(seatsResponse.data);

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

  useEffect(() => {
    fetchEventAndSeats();
  }, [id]);

  // Browsers can restore this page from the back/forward cache after
  // Razorpay redirects. Always clear transient payment/hold state and
  // reload the authoritative backend seat state.
  useEffect(() => {
    const resetTransientStateAndRefresh = () => {
      setBooking(false);
      setPaymentLoading(false);
      setHoldLoading(false);

      setHoldExpiresAt(null);
      setRemainingSeconds(0);
      setSelectedSeats([]);
      setBookingMessage("");

      fetchEventAndSeats();
    };

    window.addEventListener(
      "pageshow",
      resetTransientStateAndRefresh
    );

    window.addEventListener(
      "popstate",
      resetTransientStateAndRefresh
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        resetTransientStateAndRefresh
      );

      window.removeEventListener(
        "popstate",
        resetTransientStateAndRefresh
      );
    };
  }, [id]);

  // =========================================================
  // HOLD COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const expiry =
        new Date(holdExpiresAt).getTime();

      const now = Date.now();

      const difference =
        Math.max(
          0,
          Math.floor(
            (expiry - now) / 1000
          )
        );

      setRemainingSeconds(
        difference
      );

      if (difference <= 0) {
        setHoldExpiresAt(null);
        setSelectedSeats([]);

        setBookingMessage(
          "Your seat hold has expired. Please select your seats again."
        );

        fetchEventAndSeats();
      }
    };

    updateCountdown();

    const interval =
      setInterval(
        updateCountdown,
        1000
      );

    return () =>
      clearInterval(interval);

  }, [holdExpiresAt]);

  // =========================================================
  // FORMAT COUNTDOWN
  // =========================================================

  const formatCountdown = () => {
    const minutes =
      Math.floor(
        remainingSeconds / 60
      );

    const seconds =
      remainingSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  // =========================================================
  // LOAD RAZORPAY
  // =========================================================

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () =>
        resolve(true);

      script.onerror = () =>
        resolve(false);

      document.body.appendChild(
        script
      );
    });
  };

  // =========================================================
  // TOGGLE SEAT
  // =========================================================

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    setBookingMessage("");

    setSelectedSeats(
      (previous) => {

        if (
          previous.includes(
            seat.id
          )
        ) {
          return previous.filter(
            (seatId) =>
              seatId !== seat.id
          );
        }

        return [
          ...previous,
          seat.id,
        ];
      }
    );
  };

  // =========================================================
  // GET SELECTED SEAT NAMES
  // =========================================================

  const getSelectedSeatNames = () => {
    return seats
      .filter((seat) =>
        selectedSeats.includes(
          seat.id
        )
      )
      .map(
        (seat) =>
          seat.seatNumber
      );
  };

  // =========================================================
  // HOLD SELECTED SEATS
  // =========================================================

  const holdSelectedSeats =
    async () => {

      if (!user) {
        navigate("/login");
        return false;
      }

      if (
        selectedSeats.length === 0
      ) {
        setBookingMessage(
          "Please select at least one seat."
        );

        return false;
      }

      setHoldLoading(true);
      setBookingMessage("");

      try {
        const response =
          await api.post(
            `/api/events/${id}/seats/hold`,
            {
              seatIds:
                selectedSeats,
            }
          );

        const expiresAt =
          response.data.expiresAt;

        setHoldExpiresAt(
          expiresAt
        );

        /*
         * Update the local seat map.
         */
        setSeats(
          (previousSeats) =>
            previousSeats.map(
              (seat) =>
                selectedSeats.includes(
                  seat.id
                )
                  ? {
                      ...seat,
                      status: "HELD",
                      holdExpiresAt:
                        expiresAt,
                    }
                  : seat
            )
        );

        setBookingMessage(
          "Seats held successfully. Complete payment before the timer expires."
        );

        return true;

      } catch (err) {
        console.error(
          "Seat hold failed:",
          err
        );

        setBookingMessage(
          err.response?.data?.error ||
          "Unable to hold the selected seats."
        );

        /*
         * Refresh because another user may
         * have booked/held one of the seats.
         */
        await fetchEventAndSeats();

        return false;

      } finally {
        setHoldLoading(false);
      }
    };

  // =========================================================
  // PAYMENT / BOOKING
  // =========================================================

  const handleBooking =
    async () => {

      if (!user) {
        navigate("/login");
        return;
      }

      if (
        selectedSeats.length === 0
      ) {
        setBookingMessage(
          "Please select at least one seat."
        );

        return;
      }

      if (
        actualAvailableSeats <
        selectedSeats.length
      ) {
        setBookingMessage(
          "Not enough seats available."
        );

        return;
      }

      setBooking(true);
      setPaymentLoading(true);
      setBookingMessage("");

      try {

        // =====================================================
        // STEP 1: HOLD SEATS
        // =====================================================

        const holdSuccessful =
          await holdSelectedSeats();

        if (!holdSuccessful) {
          setBooking(false);
          setPaymentLoading(false);
          return;
        }

        // =====================================================
        // STEP 2: LOAD RAZORPAY
        // =====================================================

        const razorpayLoaded =
          await loadRazorpayScript();

        if (!razorpayLoaded) {
          throw new Error(
            "Unable to load Razorpay. Please check your internet connection."
          );
        }

        // =====================================================
        // STEP 3: CREATE PAYMENT ORDER
        // =====================================================

        const orderResponse =
          await api.post(
            "/api/payments/create-order",
            {
              eventId: Number(id),
              seatIds:
                selectedSeats,
            }
          );

        const order =
          orderResponse.data;

        // =====================================================
        // STEP 4: OPEN RAZORPAY
        // =====================================================

        const options = {
          key: order.key,

          amount: order.amount,

          currency:
            order.currency,

          name:
            "Ticket Booking System",

          description:
            `${order.eventTitle} - ${selectedSeats.length} ticket(s)`,

          order_id:
            order.orderId,

          prefill: {
            name:
              user.name || "",

            email:
              user.email || "",
          },

          theme: {
            color:
              "#4f46e5",
          },

          // ===================================================
          // PAYMENT SUCCESS
          // ===================================================

          handler:
            async function (
              response
            ) {

              try {

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

                // ---------------------------------------------
                // Clear all transient payment/hold state.
                // ---------------------------------------------

                setSelectedSeats([]);
                setHoldExpiresAt(null);
                setRemainingSeconds(0);
                setBookingMessage(
                  "Payment successful! Your booking is confirmed."
                );

                setBooking(false);
                setPaymentLoading(false);
                setHoldLoading(false);

                // The backend is the single source of truth.
                // Refresh seats/event before redirecting.
                await fetchEventAndSeats();

                // Redirect only after payment verification + refresh.
                navigate("/my-bookings", { replace: true });

              } catch (err) {

                console.error(
                  "Payment verification failed:",
                  err
                );

                setBookingMessage(
                  err.response?.data?.error ||
                  "Payment verification failed."
                );

                /*
                 * Refresh actual database state.
                 */
                await fetchEventAndSeats();

              } finally {

                setBooking(false);
                setPaymentLoading(false);
              }
            },

          // ===================================================
          // PAYMENT MODAL CLOSED
          // ===================================================

          modal: {
            ondismiss:
              async function () {

                setBooking(false);
                setPaymentLoading(
                  false
                );

                setBookingMessage(
                  "Payment cancelled. Your seats remain held until the timer expires."
                );

                /*
                 * IMPORTANT:
                 * We don't immediately release the seats here.
                 *
                 * The backend hold remains valid until its
                 * expiry time.
                 */
              },
          },
        };

        const razorpay =
          new window.Razorpay(
            options
          );

        // =====================================================
        // PAYMENT FAILED
        // =====================================================

        razorpay.on(
          "payment.failed",
          function (
            response
          ) {

            console.error(
              "Payment failed:",
              response
            );

            setBookingMessage(
              response.error
                ?.description ||
              "Payment failed. Your seats remain held until the timer expires."
            );

            setBooking(false);
            setPaymentLoading(
              false
            );
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
        setPaymentLoading(
          false
        );
      }
    };

  // =========================================================
  // JOIN WAITLIST
  // =========================================================

  const joinWaitlist = async (category) => {

    if (!user) {
      navigate("/login");
      return;
    }

    setWaitlistLoading(true);
    setWaitlistCategory(category);
    setWaitlistMessage("");

    try {

      const response = await api.post(
        `/api/waitlist/events/${id}`,
        {
          category
        }
      );

      setWaitlistMessage(
        `Joined the ${category.toLowerCase()} waitlist successfully. Your position is #${response.data.position}.`
      );

    } catch (err) {

      console.error(
        "Waitlist join failed:",
        err
      );

      setWaitlistMessage(
        err.response?.data?.error ||
        "Unable to join the waitlist."
      );

    } finally {

      setWaitlistLoading(false);

    }
  };

  // =========================================================
  // LOADING
  // =========================================================

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

  // =========================================================
  // ERROR
  // =========================================================

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
              {error ||
                "This event does not exist."}
            </p>

            <button
              onClick={() =>
                navigate("/events")
              }
              className="mt-7 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
            >
              ← Back to Events
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================
  // PRICE
  // =========================================================

  const totalPrice =
    Number(event.price) *
    selectedSeats.length;

  const formattedDate =
    new Date(
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

  const formattedDateTime =
    new Date(
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

  const selectedSeatNames =
    getSelectedSeatNames();

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white">

        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">

          <button
            onClick={() =>
              navigate("/events")
            }
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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* =================================================
              LEFT
          ================================================= */}

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
                      actualAvailableSeats > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {actualAvailableSeats > 0
                      ? `${actualAvailableSeats} seats available`
                      : "Sold out"}
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                SEAT MAP
            ================================================= */}

            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl">
                  💺
                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                    Seating
                  </p>

                  <h2 className="text-2xl font-black">
                    Select your seats
                  </h2>

                </div>

              </div>

              {/* SCREEN */}

              <div className="mt-8">

                <div className="text-center text-xs font-bold text-slate-400 mb-2">
                  SCREEN
                </div>

                <div className="h-2 max-w-xl mx-auto rounded-full bg-indigo-500" />

              </div>

              {/* LEGEND */}

              <div className="flex flex-wrap justify-center gap-5 mt-7 mb-8 text-xs font-semibold text-slate-500 dark:text-slate-400">

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                  Available
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-indigo-600" />
                  Selected
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-amber-400" />
                  Held
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-500" />
                  Booked
                </div>

              </div>

              {/* SEATS */}

              {seats.length === 0 ? (

                <div className="text-center py-10 text-slate-400">
                  No seats have been generated for this event.
                </div>

              ) : (

                <div className="max-w-3xl mx-auto">

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">

                    {seats.map((seat) => {

                      const isSelected =
                        selectedSeats.includes(
                          seat.id
                        );

                      const isBooked =
                        seat.status ===
                        "BOOKED";

                      const isHeld =
                        seat.status ===
                        "HELD";

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={
                            isBooked ||
                            isHeld ||
                            holdLoading ||
                            paymentLoading
                          }
                          onClick={() =>
                            toggleSeat(
                              seat
                            )
                          }
                          title={
                            isBooked
                              ? `${seat.seatNumber} is booked`
                              : isHeld
                              ? `${seat.seatNumber} is temporarily held`
                              : `Select ${seat.seatNumber}`
                          }
                          className={`
                            h-10
                            rounded-lg
                            text-xs
                            font-bold
                            transition-all

                            ${
                              isBooked
                                ? "bg-red-500 text-white cursor-not-allowed"
                                : isHeld
                                ? "bg-amber-400 text-amber-950 cursor-not-allowed"
                                : isSelected
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 scale-105"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                            }
                          `}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}

                  </div>

                </div>

              )}

              {/* SELECTED SEATS */}

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">

                <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                  Selected seats
                </p>

                {selectedSeatNames.length > 0 ? (

                  <div className="flex flex-wrap gap-2 mt-3">

                    {selectedSeatNames.map(
                      (seatNumber) => (

                        <span
                          key={seatNumber}
                          className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm font-bold"
                        >
                          {seatNumber}
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p className="mt-2 text-sm text-slate-400">
                    No seats selected
                  </p>

                )}

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

          {/* =================================================
              BOOKING SIDEBAR
          ================================================= */}

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

              {/* HOLD TIMER */}

              {holdExpiresAt &&
                remainingSeconds > 0 && (

                  <div className="mb-6 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 text-center">

                    <p className="text-xs uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                      Seats held for you
                    </p>

                    <p className="mt-2 text-4xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatCountdown()}
                    </p>

                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      Complete your payment before the timer expires.
                    </p>

                  </div>

                )}

              {/* AVAILABILITY */}

              <div className="flex items-center justify-between mb-5">

                <span className="text-sm font-semibold">
                  Availability
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">

                  {actualAvailableSeats > 0
                    ? `${actualAvailableSeats} left`
                    : "Sold out"}

                </span>

              </div>

              {/* SELECTED */}

              <div>

                <p className="text-sm text-slate-400">
                  Selected seats
                </p>

                <p className="mt-1 text-2xl font-black">
                  {selectedSeats.length}
                </p>

              </div>

              {/* SELECTED SEAT NAMES */}

              {selectedSeatNames.length > 0 && (

                <div className="mt-4">

                  <div className="flex flex-wrap gap-2">

                    {selectedSeatNames.map(
                      (seatNumber) => (

                        <span
                          key={seatNumber}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold"
                        >
                          {seatNumber}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

              {/* PRICE */}

              <div className="mt-7 space-y-4">

                <div className="flex justify-between text-sm text-slate-500">

                  <span>
                    {selectedSeats.length} × ₹{event.price}
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

              {/* PAYMENT */}

              {actualAvailableSeats === 0 ? (

                <div className="mt-7 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5">

                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    🎟️ This event is currently sold out
                  </p>

                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    Join a waitlist and we'll notify you when seats become available.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

                    <button
                      type="button"
                      disabled={waitlistLoading}
                      onClick={() => joinWaitlist("PREMIUM")}
                      className="py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {waitlistLoading && waitlistCategory === "PREMIUM"
                        ? "Joining..."
                        : "Premium Waitlist"}
                    </button>

                    <button
                      type="button"
                      disabled={waitlistLoading}
                      onClick={() => joinWaitlist("STANDARD")}
                      className="py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {waitlistLoading && waitlistCategory === "STANDARD"
                        ? "Joining..."
                        : "Standard Waitlist"}
                    </button>

                  </div>

                  {waitlistMessage && (
                    <div className="mt-4 rounded-xl bg-white/70 dark:bg-slate-900/60 p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {waitlistMessage}
                    </div>
                  )}

                </div>

              ) : (

                <button
                  onClick={
                    handleBooking
                  }
                  disabled={
                    booking ||
                    paymentLoading ||
                    holdLoading ||
                    selectedSeats.length === 0
                  }
                  className="w-full mt-7 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {!user
                    ? "Login to Book"
                    : selectedSeats.length === 0
                    ? "Select Seats"
                    : holdLoading
                    ? "Holding Seats..."
                    : paymentLoading
                    ? "Opening Payment..."
                    : "💳 Hold & Pay"}

                </button>

              )}

              {/* MESSAGE */}

              {bookingMessage && (

                <div
                  className={`mt-4 p-3 rounded-xl text-center text-sm font-semibold ${
                    bookingMessage
                      .toLowerCase()
                      .includes(
                        "success"
                      )
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                      : bookingMessage
                          .toLowerCase()
                          .includes(
                            "held successfully"
                          )
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
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