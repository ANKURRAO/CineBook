const TOTAL_SEATS = 20;

const firebaseConfig = {
  apiKey: "AIzaSyAX9eY4fhjMBPwojYSq2qbAhvtDlLDZcv4",
  authDomain: "cinebook-a49a8.firebaseapp.com",
  databaseURL: "https://cinebook-a49a8-default-rtdb.firebaseio.com",
  projectId: "cinebook-a49a8",
  storageBucket: "cinebook-a49a8.firebasestorage.app",
  messagingSenderId: "579843652867",
  appId: "1:579843652867:web:bafc5fec51a312ece3fd36"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const bookingsRef = database.ref("bookings");

let bookings = {};
let selectedSeat = null;

const $ = id => document.getElementById(id);

function save() {
  return bookingsRef.set(bookings);
}

function renderSeats() {
  $("seatMap").innerHTML = "";

  for (let i = 1; i <= TOTAL_SEATS; i++) {
    const b = document.createElement("button");

    b.className = "seat";
    b.type = "button";
    b.textContent = i;

    if (bookings[i]) {
      b.classList.add("booked");
      b.disabled = true;
      b.title = "Already booked";
    }

    if (selectedSeat === i) {
      b.classList.add("selected");
    }

    b.onclick = () => selectSeat(i);

    $("seatMap").appendChild(b);
  }

  updateStats();
}

function selectSeat(i) {
  if (bookings[i]) return;

  selectedSeat = i;
  $("seat").value = i;
  $("selectedSeat").textContent = "Seat " + i;
  $("selectionBar").classList.remove("hidden");

  renderSeats();
}

$("useSeat").onclick = () => {
  $("name").focus();

  $("bookingForm").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  show(
    "Seat " + selectedSeat + " selected. Enter customer details to confirm.",
    ""
  );
};

function updateStats() {
  const n = Object.keys(bookings).length;

  $("bookedCount").textContent = n;
  $("availableCount").textContent = TOTAL_SEATS - n;
}

function show(text, type) {
  $("message").textContent = text;
  $("message").className = "message " + type;
}

function validSeat(v) {
  const n = Number(v);

  return Number.isInteger(n) &&
         n >= 1 &&
         n <= TOTAL_SEATS;
}

$("bookingForm").onsubmit = async e => {
  e.preventDefault();

  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  const seat = $("seat").value;

  if (!name) {
    return show("Customer name cannot be empty.", "error");
  }

  if (!phone) {
    return show("Phone number cannot be empty.", "error");
  }

  if (!/^\d{10}$/.test(phone)) {
    return show(
      "Phone number must be exactly 10 digits.",
      "error"
    );
  }

  if (!validSeat(seat)) {
    return show(
      "Invalid seat number. Choose 1 to 20.",
      "error"
    );
  }

  const n = Number(seat);

  if (bookings[n]) {
    return show(
      "Seat " + n + " is already booked. Please select another seat.",
      "error"
    );
  }

  bookings[n] = {
    name: name,
    phone: phone
  };

  try {
    await save();

    selectedSeat = null;
    $("selectionBar").classList.add("hidden");

    $("bookingForm").reset();

    renderSeats();
    renderBookings();

    show(
      "Seat " + n + " booked successfully.",
      "success"
    );

  } catch (error) {
    delete bookings[n];

    console.error(error);

    show(
      "Booking failed. Please try again.",
      "error"
    );
  }
};

function renderBookings() {
  const body = $("bookingTable");

  body.innerHTML = "";

  const seats = Object.keys(bookings)
    .map(Number)
    .sort((a, b) => a - b);

  if (!seats.length) {
    body.innerHTML =
      '<tr><td colspan="4">No bookings found.</td></tr>';

    return;
  }

  seats.forEach(s => {
    const d = bookings[s];

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><b>${s}</b></td>
      <td>${safe(d.name)}</td>
      <td>${safe(d.phone)}</td>
      <td>
        <button class="cancel" data-seat="${s}">
          Cancel
        </button>
      </td>
    `;

    body.appendChild(tr);
  });

  document.querySelectorAll(".cancel").forEach(x => {
    x.onclick = () =>
      cancelBooking(Number(x.dataset.seat));
  });
}

async function cancelBooking(s) {
  if (!bookings[s]) {
    return show(
      "No booking exists for seat " + s + ".",
      "error"
    );
  }

  if (confirm("Cancel booking for seat " + s + "?")) {

    const oldBooking = bookings[s];

    delete bookings[s];

    try {
      await save();

      renderSeats();
      renderBookings();

      show(
        "Booking cancelled successfully.",
        "success"
      );

    } catch (error) {
      bookings[s] = oldBooking;

      console.error(error);

      show(
        "Cancellation failed. Please try again.",
        "error"
      );
    }
  }
}

function searchBooking() {
  const q = $("search").value.trim().toLowerCase();
  const out = $("results");

  if (!q) {
    out.className = "results muted";
    out.textContent =
      "Please enter a name, phone or seat number.";

    return;
  }

  const matches = Object.entries(bookings).filter(
    ([s, d]) =>
      s === q ||
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q)
  );

  if (!matches.length) {
    out.className = "results muted";
    out.textContent = "No matching booking found.";

    return;
  }

  out.className = "results";

  out.innerHTML = matches
    .map(
      ([s, d]) => `
        <div class="result">
          <strong>Booking Found · Seat ${s}</strong>
          Customer: ${safe(d.name)}
          <br>
          Phone: ${safe(d.phone)}
        </div>
      `
    )
    .join("");
}

$("searchBtn").onclick = searchBooking;

$("search").onkeydown = e => {
  if (e.key === "Enter") {
    searchBooking();
  }
};

$("clearAll").onclick = async () => {
  if (!Object.keys(bookings).length) return;

  if (confirm("Clear all current bookings?")) {

    const oldBookings = { ...bookings };

    bookings = {};

    try {
      await save();

      selectedSeat = null;

      $("selectionBar").classList.add("hidden");

      renderSeats();
      renderBookings();

      show(
        "All bookings cleared.",
        "success"
      );

    } catch (error) {
      bookings = oldBookings;

      console.error(error);

      show(
        "Could not clear bookings. Please try again.",
        "error"
      );
    }
  }
};

$("themeBtn").onclick = () => {
  document.body.classList.toggle("dark");

  $("themeBtn").textContent =
    document.body.classList.contains("dark")
      ? "☀"
      : "☾";
};

function safe(v) {
  return String(v).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c])
  );
}

/* REAL-TIME FIREBASE SYNC */

bookingsRef.on(
  "value",
  snapshot => {

    bookings = snapshot.val() || {};

    renderSeats();
    renderBookings();
  },

  error => {

    console.error(error);

    show(
      "Could not connect to the booking database.",
      "error"
    );
  }
);