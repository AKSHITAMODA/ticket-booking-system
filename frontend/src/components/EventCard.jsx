import { Link } from "react-router-dom";

export default function EventCard({ event }) {

  const eventDate = new Date(event.eventDate);

  const day = eventDate.toLocaleDateString("en-IN", {
    day: "numeric",
  });

  const month = eventDate.toLocaleDateString("en-IN", {
    month: "short",
  });

  const fullDate = eventDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isAvailable = event.availableSeats > 0;

  return (
    <article
      className="
        group
        bg-white dark:bg-slate-900
        rounded-3xl
        border border-slate-200 dark:border-slate-800
        overflow-hidden
        shadow-sm dark:shadow-black/20
        hover:shadow-2xl
        hover:shadow-indigo-100/50 dark:hover:shadow-indigo-950/30
        hover:-translate-y-2
        transition-all duration-300
      "
    >

      {/* ================= IMAGE / COVER ================= */}

      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">

        {/* Decorative shapes */}

        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/10 blur-2xl" />

        <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-indigo-300/20 blur-2xl" />

        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        {/* Dark overlay */}

        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition" />

        {/* Ticket icon */}

        <div className="absolute inset-0 flex items-center justify-center">

          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-2 transition-all duration-500">

            <span className="text-6xl drop-shadow-xl">
              🎟️
            </span>

          </div>

        </div>


        {/* ================= DATE BADGE ================= */}

        <div className="absolute top-4 left-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-center min-w-[62px]">

          <div className="bg-indigo-600 px-3 py-1.5">

            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              {month}
            </span>

          </div>

          <div className="px-3 py-2">

            <span className="block text-2xl font-black text-slate-900 dark:text-white leading-none">
              {day}
            </span>

          </div>

        </div>


        {/* ================= PRICE ================= */}

        <div className="absolute top-4 right-4">

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl">

            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
              Tickets from
            </p>

            <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">
              ₹{event.price}
            </p>

          </div>

        </div>


        {/* ================= EVENT TYPE ================= */}

        <div className="absolute bottom-4 left-4">

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider">

            <span className="w-1.5 h-1.5 rounded-full bg-white" />

            Event

          </span>

        </div>

      </div>


      {/* ================= CONTENT ================= */}

      <div className="p-6">

        {/* Title */}

        <h3 className="
          text-xl
          font-black
          text-slate-900 dark:text-white
          leading-tight
          line-clamp-2
          group-hover:text-indigo-600
          dark:group-hover:text-indigo-400
          transition-colors
        ">

          {event.title}

        </h3>


        {/* Description */}

        <p className="
          mt-3
          text-sm
          text-slate-500 dark:text-slate-400
          leading-relaxed
          line-clamp-2
        ">

          {event.description ||
            "Join us for an unforgettable experience."}

        </p>


        {/* ================= INFO ================= */}

        <div className="mt-6 space-y-3">


          {/* ================= VENUE ================= */}

          <div className="flex items-center gap-3">

            <div className="
              w-10 h-10
              rounded-xl
              bg-indigo-50 dark:bg-indigo-950/50
              flex items-center justify-center
              shrink-0
              text-lg
            ">
              📍
            </div>

            <div className="min-w-0">

              <p className="
                text-[11px]
                uppercase
                tracking-wide
                text-slate-400 dark:text-slate-500
                font-bold
              ">
                Venue
              </p>

              <p className="
                text-sm
                font-semibold
                text-slate-700 dark:text-slate-200
                truncate
              ">
                {event.venue}
              </p>

            </div>

          </div>


          {/* ================= DATE ================= */}

          <div className="flex items-center gap-3">

            <div className="
              w-10 h-10
              rounded-xl
              bg-purple-50 dark:bg-purple-950/50
              flex items-center justify-center
              shrink-0
              text-lg
            ">
              🗓️
            </div>

            <div>

              <p className="
                text-[11px]
                uppercase
                tracking-wide
                text-slate-400 dark:text-slate-500
                font-bold
              ">
                Date
              </p>

              <p className="
                text-sm
                font-semibold
                text-slate-700 dark:text-slate-200
              ">
                {fullDate}
              </p>

            </div>

          </div>


          {/* ================= AVAILABILITY ================= */}

          <div className="flex items-center gap-3">

            <div
              className={`
                w-10 h-10
                rounded-xl
                flex items-center justify-center
                shrink-0
                text-lg

                ${
                  isAvailable
                    ? "bg-emerald-50 dark:bg-emerald-950/50"
                    : "bg-red-50 dark:bg-red-950/40"
                }
              `}
            >
              🎫
            </div>

            <div>

              <p className="
                text-[11px]
                uppercase
                tracking-wide
                text-slate-400 dark:text-slate-500
                font-bold
              ">
                Availability
              </p>

              <p
                className={`
                  text-sm
                  font-bold

                  ${
                    isAvailable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }
                `}
              >
                {isAvailable
                  ? `${event.availableSeats} seats available`
                  : "Sold out"}
              </p>

            </div>

          </div>

        </div>


        {/* ================= ACTION ================= */}

        <div className="
          mt-6
          pt-5
          border-t
          border-slate-100 dark:border-slate-800
        ">

          <Link
            to={`/events/${event.id}`}
            className="
              flex
              items-center
              justify-center
              gap-2
              w-full
              py-3.5
              rounded-xl
              bg-indigo-600
              text-white
              font-bold
              shadow-lg
              shadow-indigo-100
              dark:shadow-indigo-950/40
              hover:bg-indigo-700
              hover:shadow-xl
              hover:shadow-indigo-200
              dark:hover:shadow-indigo-950/60
              transition-all
            "
          >

            View Event

            <span className="
              group-hover:translate-x-1
              transition-transform duration-200
            ">
              →
            </span>

          </Link>

        </div>

      </div>

    </article>
  );
}