import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function OrganiserDashboard() {

  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    eventDate: "",
    totalSeats: "",
    price: "",
  });

  // ================= AUTHORIZATION =================

  useEffect(() => {

    // VERY IMPORTANT:
    // Wait until AuthContext finishes checking
    // localStorage / /api/auth/me.

    if (authLoading) {
      return;
    }

    // No logged-in user
    if (!user) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const role =
      String(user.role || "").toUpperCase();

    // Only ORGANISER and ADMIN
    if (
      role !== "ORGANISER" &&
      role !== "ADMIN"
    ) {

      navigate("/events", {
        replace: true,
      });

      return;
    }

    // Authorized
    fetchEvents();

  }, [user, authLoading]);

  // ================= FETCH EVENTS =================

  const fetchEvents = async () => {

    setLoading(true);
    setError("");

    try {

      const response = await api.get(
        "/api/events"
      );

      const allEvents = response.data;

      const role =
        String(user?.role || "").toUpperCase();

      if (role === "ADMIN") {

        setEvents(allEvents);

      } else {

        const organiserEvents =
          allEvents.filter(
            (event) =>
              event.organiser?.id === user?.id
          );

        setEvents(organiserEvents);
      }

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        "Unable to load events."
      );

    } finally {

      setLoading(false);

    }
  };

  // ================= FORM =================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {

    setForm({
      title: "",
      description: "",
      venue: "",
      eventDate: "",
      totalSeats: "",
      price: "",
    });

    setEditingEvent(null);
    setShowForm(false);
  };

  // ================= CREATE =================

  const handleCreate = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    try {

      await api.post(
        "/api/events",
        {
          title: form.title,
          description: form.description,
          venue: form.venue,
          eventDate: form.eventDate,
          totalSeats: Number(
            form.totalSeats
          ),
          price: Number(
            form.price
          ),
        }
      );

      setMessage(
        "Event created successfully."
      );

      resetForm();

      await fetchEvents();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        "Unable to create event."
      );
    }
  };

  // ================= EDIT =================

  const startEdit = (event) => {

    setEditingEvent(event);

    setForm({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      eventDate: event.eventDate
        ? event.eventDate.slice(0, 16)
        : "",
      totalSeats:
        event.totalSeats || "",
      price:
        event.price || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= UPDATE =================

  const handleUpdate = async (e) => {

    e.preventDefault();

    if (!editingEvent) {
      return;
    }

    setError("");
    setMessage("");

    try {

      await api.put(
        `/api/events/${editingEvent.id}`,
        {
          title: form.title,
          description: form.description,
          venue: form.venue,
          eventDate: form.eventDate,
          totalSeats: Number(
            form.totalSeats
          ),
          price: Number(
            form.price
          ),
        }
      );

      setMessage(
        "Event updated successfully."
      );

      resetForm();

      await fetchEvents();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        "Unable to update event."
      );
    }
  };

  // ================= DELETE =================

  const handleDelete = async (eventId) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {

      await api.delete(
        `/api/events/${eventId}`
      );

      setMessage(
        "Event deleted successfully."
      );

      await fetchEvents();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.error ||
        "Unable to delete event."
      );
    }
  };

  // ================= AUTH LOADING =================

  if (authLoading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="flex justify-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500">
              Checking permissions...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ================= NO USER =================

  if (!user) {
    return null;
  }

  // ================= ROLE CHECK =================

  const role =
    String(user.role || "").toUpperCase();

  if (
    role !== "ORGANISER" &&
    role !== "ADMIN"
  ) {
    return null;
  }

  // ================= PAGE LOADING =================

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <Navbar />

        <div className="flex justify-center py-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />

            <p className="mt-4 text-slate-500">
              Loading dashboard...
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ================= DASHBOARD =================

  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700">

        <div className="max-w-7xl mx-auto px-6 py-14">

          <p className="text-indigo-100 font-medium">
            {role === "ADMIN"
              ? "Administrator"
              : "Organiser"}
          </p>

          <h1 className="text-4xl md:text-5xl font-black text-white mt-2">
            Dashboard
          </h1>

          <p className="text-indigo-100 mt-4 text-lg">
            Create and manage your events.
          </p>

        </div>

      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {/* HEADER */}

        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Your Events
            </h2>

            <p className="text-slate-500 mt-1">
              {events.length} event
              {events.length !== 1
                ? "s"
                : ""}
            </p>

          </div>

          <button
            onClick={() => {

              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }

            }}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
          >
            {showForm
              ? "Close Form"
              : "+ Create Event"}
          </button>

        </div>

        {/* FORM */}

        {showForm && (

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 mb-10">

            <h2 className="text-2xl font-bold text-slate-900 mb-6">

              {editingEvent
                ? "Edit Event"
                : "Create New Event"}

            </h2>

            <form
              onSubmit={
                editingEvent
                  ? handleUpdate
                  : handleCreate
              }
              className="space-y-5"
            >

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Event Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Venue
                </label>

                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Event Date
                  </label>

                  <input
                    type="datetime-local"
                    name="eventDate"
                    value={form.eventDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Seats
                  </label>

                  <input
                    type="number"
                    name="totalSeats"
                    value={form.totalSeats}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ticket Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                </div>

              </div>

              <div className="flex gap-3 pt-3">

                <button
                  type="submit"
                  className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  {editingEvent
                    ? "Update Event"
                    : "Create Event"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="px-7 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {/* EVENTS */}

        {events.length === 0 ? (

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <div className="text-5xl">
              🎟️
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-4">
              No events yet
            </h3>

            <p className="text-slate-500 mt-2">
              Create your first event to get started.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {events.map((event) => (

              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">

                  <p className="text-indigo-100 text-sm">
                    {new Date(
                      event.eventDate
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>

                  <h3 className="text-2xl font-bold text-white mt-1">
                    {event.title}
                  </h3>

                </div>

                <div className="p-6">

                  <p className="text-slate-500">
                    {event.description}
                  </p>

                  <div className="mt-5 space-y-3">

                    <p className="text-slate-700">
                      📍 {event.venue}
                    </p>

                    <p className="text-slate-700">
                      💺 {event.availableSeats} /
                      {" "}
                      {event.totalSeats}
                      {" "}
                      seats available
                    </p>

                    <p className="text-slate-700">
                      💰 ₹
                      {Number(
                        event.price
                      ).toFixed(2)}
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-200">

                    <button
                      onClick={() =>
                        navigate(
                          `/events/${event.id}`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        startEdit(event)
                      }
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/organiser/dashboard/bookings/${event.id}`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
                    >
                      Bookings
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(event.id)
                      }
                      className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>

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