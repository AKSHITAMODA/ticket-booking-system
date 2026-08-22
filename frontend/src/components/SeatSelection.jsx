export default function SeatSelection({
  seats,
  selectedSeats,
  setSelectedSeats,
}) {
  const handleSeatClick = (seat) => {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    const alreadySelected =
      selectedSeats.some(
        (selected) =>
          selected.id === seat.id
      );

    if (alreadySelected) {
      setSelectedSeats(
        selectedSeats.filter(
          (selected) =>
            selected.id !== seat.id
        )
      );
    } else {
      setSelectedSeats([
        ...selectedSeats,
        seat,
      ]);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-7 md:p-9 shadow-sm">

      {/* HEADER */}

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-xl">
          🪑
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

      <div className="max-w-2xl mx-auto mt-10">

        <div className="h-2 bg-slate-800 dark:bg-slate-200 rounded-full" />

        <p className="text-center mt-3 text-xs uppercase tracking-widest text-slate-400">
          Screen / Stage
        </p>

        {/* SEATS */}

        {seats.length === 0 ? (

          <p className="text-center mt-10 text-slate-500">
            No seats found.
          </p>

        ) : (

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 mt-10">

            {seats.map((seat) => {

              const selected =
                selectedSeats.some(
                  (selectedSeat) =>
                    selectedSeat.id ===
                    seat.id
                );

              const available =
                seat.status ===
                "AVAILABLE";

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!available}
                  onClick={() =>
                    handleSeatClick(
                      seat
                    )
                  }
                  title={
                    available
                      ? `Select ${seat.seatNumber}`
                      : `${seat.seatNumber} is booked`
                  }
                  className={`
                    aspect-square
                    rounded-xl
                    border
                    text-xs
                    sm:text-sm
                    font-bold
                    transition-all

                    ${
                      !available
                        ? "bg-red-100 dark:bg-red-950/40 text-red-500 border-red-200 dark:border-red-900 cursor-not-allowed"
                        : selected
                        ? "bg-indigo-600 text-white border-indigo-600 scale-105 shadow-lg"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    }
                  `}
                >
                  {seat.seatNumber}
                </button>
              );
            })}

          </div>

        )}

        {/* LEGEND */}

        <div className="flex flex-wrap justify-center gap-6 mt-10">

          <div className="flex items-center gap-2">

            <div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />

            <span className="text-xs text-slate-500">
              Available
            </span>

          </div>

          <div className="flex items-center gap-2">

            <div className="w-4 h-4 rounded bg-indigo-600" />

            <span className="text-xs text-slate-500">
              Selected
            </span>

          </div>

          <div className="flex items-center gap-2">

            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900" />

            <span className="text-xs text-slate-500">
              Booked
            </span>

          </div>

        </div>

      </div>

      {/* SELECTED SEATS */}

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">

        <p className="text-sm text-slate-400">
          Selected seats
        </p>

        <p className="mt-2 font-bold">

          {selectedSeats.length ===
          0
            ? "No seats selected"
            : selectedSeats
                .map(
                  (seat) =>
                    seat.seatNumber
                )
                .join(", ")}

        </p>

      </div>

    </section>
  );
}