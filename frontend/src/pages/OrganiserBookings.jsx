import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function OrganiserBookings() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH =================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    const role =
      String(user.role || "").toUpperCase();

    if (
      role !== "ORGANISER" &&
      role !== "ADMIN"
    ) {
      navigate("/events", {
        replace: true,
      });
      return;
    }

    fetchBookings();
  }, [user, authLoading, eventId]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const eventResponse = await api.get(
        `/api/events/${eventId}`
      );

      setEvent(eventResponse.data);

      const bookingResponse = await api.get(
        `/api/bookings/event/${eventId}`
      );

      setBookings(bookingResponse.data);

    } catch (err) {
      console.error(
        "Failed to load bookings:",
        err
      );

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to view these bookings."
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Unable to load bookings."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING =================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <Navbar />

        <div className="flex justify-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading bookings...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ================= ERROR =================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

        <Navbar />

        <main className="max-w-5xl mx-auto px-6 py-16">

          <button
            onClick={() =>
              navigate("/organiser/dashboard")
            }
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            ← Back to Dashboard
          </button>

          <div className="mt-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">

            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">
              Unable to load bookings
            </h1>

            <p className="mt-3 text-red-600 dark:text-red-400">
              {error}
            </p>

          </div>

        </main>

      </div>
    );
  }


  // ================= STATS =================

  const confirmedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CONFIRMED"
    );

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "CANCELLED"
    );

  const totalTickets =
    confirmedBookings.reduce(
      (sum, booking) =>
        sum +
        Number(
          booking.numberOfSeats
        ),
      0
    );

  const totalRevenue =
    confirmedBookings.reduce(
      (sum, booking) =>
        sum +
        Number(
          booking.totalAmount
        ),
      0
    );


  // ================= PAGE =================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

      <Navbar />


      {/* ================= HEADER ================= */}

      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700">

        <div className="max-w-7xl mx-auto px-6 py-14">

          <button
            onClick={() =>
              navigate("/organiser/dashboard")
            }
            className="text-indigo-100 hover:text-white mb-6"
          >
            ← Back to Dashboard
          </button>

          <p className="text-indigo-100 font-medium">
            Event Bookings
          </p>

          <h1 className="text-4xl md:text-5xl font-black text-white mt-2">
            {event?.title || "Bookings"}
          </h1>

          <p className="text-indigo-100 mt-3">
            {event?.venue}
          </p>

        </div>

      </section>


      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">

          {/* TOTAL */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-black/20">

            <p className="text-sm text-slate-400">
              Total Bookings
            </p>

            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {bookings.length}
            </p>

          </div>


          {/* CONFIRMED */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-black/20">

            <p className="text-sm text-slate-400">
              Confirmed
            </p>

            <p className="text-3xl font-black text-green-600 dark:text-green-400 mt-2">
              {confirmedBookings.length}
            </p>

          </div>


          {/* TICKETS */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-black/20">

            <p className="text-sm text-slate-400">
              Tickets Sold
            </p>

            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {totalTickets}
            </p>

          </div>


          {/* REVENUE */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-black/20">

            <p className="text-sm text-slate-400">
              Revenue
            </p>

            <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
              ₹{totalRevenue.toFixed(2)}
            </p>

          </div>

        </div>


        {/* ================= CANCELLED ================= */}

        {cancelledBookings.length > 0 && (
          <div className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            {cancelledBookings.length} cancelled booking
            {cancelledBookings.length !== 1
              ? "s"
              : ""}
          </div>
        )}


        {/* ================= NO BOOKINGS ================= */}

        {bookings.length === 0 ? (

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">

            <div className="text-5xl">
              🎟️
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-5">
              No bookings yet
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Customers haven't booked this event yet.
            </p>

          </div>

        ) : (

          /* ================= BOOKINGS ================= */

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-black/20">

            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Customer Bookings
              </h2>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 dark:bg-slate-800">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Customer
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Tickets
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Amount
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">
                      Booked On
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {bookings.map((booking) => (

                    <tr
                      key={booking.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >

                      {/* CUSTOMER */}

                      <td className="px-6 py-5">

                        <p className="font-semibold text-slate-900 dark:text-white">
                          {booking.user.name}
                        </p>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {booking.user.email}
                        </p>

                      </td>


                      {/* TICKETS */}

                      <td className="px-6 py-5">

                        <span className="font-semibold text-slate-900 dark:text-white">
                          {booking.numberOfSeats}
                        </span>

                      </td>


                      {/* AMOUNT */}

                      <td className="px-6 py-5">

                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹
                          {Number(
                            booking.totalAmount
                          ).toFixed(2)}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status ===
                            "CONFIRMED"
                              ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {booking.status}
                        </span>

                      </td>


                      {/* DATE */}

                      <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">

                        {new Date(
                          booking.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </td>

                    </tr>   

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}