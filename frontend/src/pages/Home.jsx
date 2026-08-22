import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/events");
        setEvents(response.data);
      } catch (err) {
        console.error("Failed to load events:", err);
        setError("Unable to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white">

        {/* Background decorations */}

        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">

          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* ================= LEFT ================= */}

            <div>

              {/* Badge */}

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sm font-semibold">

                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                Your next experience starts here

              </div>

              {/* Heading */}

              <h1 className="mt-7 text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">

                Discover events.

                <span className="block text-indigo-200">
                  Make memories.
                </span>

              </h1>

              {/* Description */}

              <p className="mt-7 text-lg md:text-xl text-indigo-100 leading-relaxed max-w-xl">

                Discover concerts, festivals, workshops and
                experiences worth showing up for. Find your
                event, choose your seats, and book in seconds.

              </p>

              {/* CTA */}

              <div className="mt-9 flex flex-wrap gap-4">

                <a
                  href="#events"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-indigo-700 font-black shadow-xl shadow-indigo-950/20 hover:bg-indigo-50 hover:-translate-y-1 transition-all"
                >
                  Explore Events

                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>

                </a>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md font-bold hover:bg-white/20 hover:-translate-y-1 transition-all"
                >
                  Create Account
                </Link>

              </div>

              {/* Stats */}

              <div className="mt-12 flex flex-wrap items-center gap-7 md:gap-9">

                <div>
                  <p className="text-2xl font-black">
                    Easy
                  </p>

                  <p className="mt-1 text-sm text-indigo-200">
                    Event discovery
                  </p>
                </div>

                <div className="hidden sm:block h-10 w-px bg-white/20" />

                <div>
                  <p className="text-2xl font-black">
                    Secure
                  </p>

                  <p className="mt-1 text-sm text-indigo-200">
                    Ticket booking
                  </p>
                </div>

                <div className="hidden sm:block h-10 w-px bg-white/20" />

                <div>
                  <p className="text-2xl font-black">
                    Instant
                  </p>

                  <p className="mt-1 text-sm text-indigo-200">
                    Confirmation
                  </p>
                </div>

              </div>

            </div>

            {/* ================= RIGHT VISUAL ================= */}

            <div className="hidden lg:flex justify-center">

              <div className="relative w-[430px] h-[470px]">

                {/* Decorative back card */}

                <div className="absolute top-12 right-0 w-80 h-[350px] rounded-[2rem] bg-white/10 border border-white/20 rotate-6 backdrop-blur-md" />

                {/* Second card */}

                <div className="absolute top-7 right-8 w-80 h-[350px] rounded-[2rem] bg-white/5 border border-white/10 -rotate-3 backdrop-blur-sm" />

                {/* Main event card */}

                <div className="absolute top-0 left-0 w-80 rounded-[2rem] bg-white text-slate-900 shadow-2xl shadow-black/30 overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform duration-500">

                  <div className="relative h-52 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">

                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-indigo-200/20 blur-2xl" />

                    <div className="relative w-24 h-24 rounded-3xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center">

                      <span className="text-6xl">
                        🎵
                      </span>

                    </div>

                  </div>

                  <div className="p-6">

                    <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
                      Featured Event
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      Live Music Experience
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Music • Chennai
                    </p>

                    <div className="mt-6 flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-400">
                          Tickets from
                        </p>

                        <p className="mt-1 font-black text-slate-900">
                          ₹799
                        </p>
                      </div>

                      <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-black">
                        Book now
                      </span>

                    </div>

                  </div>

                </div>

                {/* Floating notification */}

                <div className="absolute right-0 bottom-8 bg-white rounded-2xl shadow-2xl px-5 py-4 text-slate-900">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      ✓
                    </div>

                    <div>

                      <p className="text-xs text-slate-400 font-medium">
                        Booking confirmed
                      </p>

                      <p className="text-sm font-black">
                        Your seat is secured!
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          EVENTS
      ========================================================= */}

      <main
        id="events"
        className="max-w-7xl mx-auto px-6 lg:px-8 py-24"
      >

        {/* Section heading */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">

          <div>

            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">

              <span className="w-8 h-px bg-indigo-600 dark:bg-indigo-400" />

              What's happening

            </div>

            <h2 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Find your next experience
            </h2>

            <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">
              Explore upcoming events and book your seat.
            </p>

          </div>

          <Link
            to="/events"
            className="group inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 transition"
          >
            View all events

            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>

          </Link>

        </div>

        {/* ================= LOADING ================= */}

        {loading && (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

            {[1, 2, 3].map((item) => (

              <div
                key={item}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
              >

                <div className="h-56 bg-slate-200 dark:bg-slate-800 animate-pulse" />

                <div className="p-6 space-y-4">

                  <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />

                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />

                  <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />

                  <div className="pt-3">
                    <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (

          <div className="rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-8">

            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>

              <div>

                <p className="font-black text-red-800 dark:text-red-300">
                  Unable to load events
                </p>

                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
                >
                  Try Again
                </button>

              </div>

            </div>

          </div>

        )}

        {/* ================= NO EVENTS ================= */}

        {!loading &&
          !error &&
          events.length === 0 && (

            <div className="text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">

              <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-4xl">
                🎫
              </div>

              <h3 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
                No events yet
              </h3>

              <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                There aren't any upcoming events right now.
                Check back soon for exciting experiences.
              </p>

              <Link
                to="/events"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
              >
                Browse Events →
              </Link>

            </div>

          )}

        {/* ================= EVENT GRID ================= */}

        {!loading &&
          !error &&
          events.length > 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

              {events.map((event) => (

                <EventCard
                  key={event.id}
                  event={event}
                />

              ))}

            </div>

          )}

      </main>

      {/* =========================================================
          WHY TICKETLY
      ========================================================= */}

      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors duration-300">

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">

          <div className="text-center max-w-2xl mx-auto">

            <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">
              Why Ticketly?
            </p>

            <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              Built for better event experiences
            </h2>

            <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">
              From discovering an event to securing your seat,
              Ticketly keeps everything simple.
            </p>

          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {[
              {
                icon: "🎟️",
                title: "Easy Booking",
                text: "Discover events and reserve your seats in just a few clicks.",
              },
              {
                icon: "🔐",
                title: "Secure",
                text: "Your account and booking information stays protected.",
              },
              {
                icon: "📅",
                title: "Discover",
                text: "Find concerts, festivals, workshops and experiences.",
              },
              {
                icon: "⚡",
                title: "Instant",
                text: "Get quick confirmation once your booking is complete.",
              },
            ].map((feature) => (

              <div
                key={feature.title}
                className="group p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-indigo-950/30 hover:-translate-y-1 transition-all duration-300"
              >

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-black text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feature.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =========================================================
          CTA
      ========================================================= */}

      <section className="relative overflow-hidden bg-slate-950 text-white">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">

          <p className="text-indigo-400 font-black text-sm uppercase tracking-wider">
            Ready to experience more?
          </p>

          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
            Your next unforgettable moment is waiting.
          </h2>

          <p className="mt-5 text-slate-400 text-lg max-w-xl mx-auto">
            Join Ticketly and discover events worth
            showing up for.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 font-black shadow-xl shadow-indigo-950 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
            >
              Get Started
              <span>→</span>
            </Link>

            <Link
              to="/events"
              className="inline-flex items-center px-8 py-4 rounded-xl border border-slate-700 text-slate-200 font-bold hover:bg-slate-900 transition"
            >
              Explore Events
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}