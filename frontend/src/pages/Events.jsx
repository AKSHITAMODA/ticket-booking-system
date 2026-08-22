import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/api/events");
        setEvents(response.data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.error ||
            "Unable to load events"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />

      {/* ================= HERO ================= */}

      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white">

        <div className="max-w-7xl mx-auto px-6 py-20">

          <div className="max-w-3xl">

            <span className="inline-block px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6">
              🎟️ Your next experience starts here
            </span>

            <h1 className="text-5xl md:text-6xl font-black leading-tight">
              Discover events.
              <br />
              Book unforgettable
              <br />
              moments.
            </h1>

            <p className="mt-6 text-lg text-indigo-100 max-w-2xl">
              Find concerts, festivals, workshops and
              experiences around you. Secure your seats
              in just a few clicks.
            </p>

          </div>

        </div>

      </section>


      {/* ================= EVENTS ================= */}

      <main className="max-w-7xl mx-auto px-6 py-14">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Upcoming Events
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Find something you'll love.
            </p>

          </div>

          <span className="text-sm font-semibold text-slate-400">
            {events.length} event
            {events.length !== 1 ? "s" : ""}
          </span>

        </div>


        {/* ================= LOADING ================= */}

        {loading && (
          <div className="text-center py-20">

            <div className="inline-block w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading events...
            </p>

          </div>
        )}


        {/* ================= ERROR ================= */}

        {!loading && error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-6 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}


        {/* ================= NO EVENTS ================= */}

        {!loading &&
          !error &&
          events.length === 0 && (
            <div className="text-center py-20">

              <div className="text-6xl mb-5">
                🎟️
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                No events yet
              </h3>

              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Check back soon for exciting events.
              </p>

            </div>
          )}


        {/* ================= EVENT CARDS ================= */}

        {!loading &&
          !error &&
          events.length > 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

              {events.map((event) => (

                <div
                  key={event.id}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300"
                >

                  {/* CARD TOP */}

                  <div className="h-44 bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 p-6 flex items-end relative overflow-hidden">

                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                    <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative">

                      <p className="text-indigo-100 text-sm font-medium">
                        {new Date(
                          event.eventDate
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>

                      <h3 className="text-2xl font-black text-white mt-1 line-clamp-2">
                        {event.title}
                      </h3>

                    </div>

                  </div>


                  {/* CARD BODY */}

                  <div className="p-6">

                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 min-h-[40px]">
                      {event.description ||
                        "Join us for an unforgettable experience."}
                    </p>


                    <div className="mt-5 space-y-3">

                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">

                        <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                          📍
                        </span>

                        <span className="truncate">
                          {event.venue}
                        </span>

                      </div>


                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">

                        <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                          🪑
                        </span>

                        <span>
                          {event.availableSeats} seats available
                        </span>

                      </div>


                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">

                        <div>

                          <p className="text-xs text-slate-400">
                            Starting from
                          </p>

                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            ₹{event.price}
                          </p>

                        </div>


                        <Link
                          to={`/events/${event.id}`}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40"
                        >
                          View Event
                        </Link>

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