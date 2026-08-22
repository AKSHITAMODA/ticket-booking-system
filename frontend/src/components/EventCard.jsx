import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      {/* Event Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <span className="text-6xl">🎟️</span>
      </div>

      <div className="p-6">

        <div className="flex items-start justify-between gap-4">

          <h3 className="text-xl font-bold text-slate-900">
            {event.title}
          </h3>

          <span className="shrink-0 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">
            ₹{event.price}
          </span>

        </div>

        <p className="mt-3 text-slate-500 line-clamp-2">
          {event.description}
        </p>

        <div className="mt-5 space-y-2 text-sm text-slate-600">

          <p>
            📍 {event.venue}
          </p>

          <p>
            📅{" "}
            {new Date(event.eventDate).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              }
            )}
          </p>

          <p>
            🎫 {event.availableSeats} seats available
          </p>

        </div>

        <Link
          to={`/events/${event.id}`}
          className="mt-6 block text-center w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          View Event
        </Link>

      </div>

    </div>
  );
}