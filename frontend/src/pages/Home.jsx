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

        const response =
          await api.get("/api/events");

        setEvents(response.data);

      } catch (err) {

        setError(
          "Unable to load events. Please try again."
        );

      } finally {

        setLoading(false);

      }
    };

    fetchEvents();

  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      {/* ================= HERO ================= */}

      <section className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white">

        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="max-w-3xl">

            <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              🎟️ Your next experience starts here
            </span>

            <h1 className="text-5xl md:text-6xl font-black leading-tight">
              Discover events.
              <br />
              Book unforgettable moments.
            </h1>

            <p className="mt-6 text-lg text-indigo-100 max-w-2xl">
              Find concerts, festivals, workshops and
              experiences around you. Secure your seats
              in just a few clicks.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <a
                href="#events"
                className="px-7 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition"
              >
                Explore Events
              </a>

              <Link
                to="/register"
                className="px-7 py-3 rounded-xl border border-white/30 bg-white/10 font-bold hover:bg-white/20 transition"
              >
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ================= EVENTS ================= */}

      <main
        id="events"
        className="max-w-7xl mx-auto px-6 py-16"
      >

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">

          <div>

            <p className="text-indigo-600 font-semibold">
              WHAT'S HAPPENING
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Upcoming Events
            </h2>

            <p className="mt-2 text-slate-500">
              Find your next experience.
            </p>

          </div>

          <span className="text-sm text-slate-500">
            {events.length} event
            {events.length !== 1 ? "s" : ""}
          </span>

        </div>

        {/* Loading */}

        {loading && (

          <div className="py-20 text-center">

            <div className="inline-block h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />

            <p className="mt-4 text-slate-500">
              Loading events...
            </p>

          </div>

        )}

        {/* Error */}

        {!loading && error && (

          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700">
            {error}
          </div>

        )}

        {/* No events */}

        {!loading &&
          !error &&
          events.length === 0 && (

            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">

              <div className="text-6xl">
                🎫
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No events yet
              </h3>

              <p className="mt-2 text-slate-500">
                Check back soon for exciting events.
              </p>

            </div>

          )}

        {/* Event Grid */}

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

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-4">

          <p className="font-bold text-indigo-600">
            Ticketly
          </p>

          <p className="text-sm text-slate-500">
            © 2026 Ticketly. Built with React & Spring Boot.
          </p>

        </div>

      </footer>

    </div>
  );
}