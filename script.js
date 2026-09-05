const TOTAL_SEATS = 20;

// ===============================
// FIREBASE CONFIGURATION
// ===============================

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


// ===============================
// HELPER FUNCTION
// ===============================

const $ = id => document.getElementById(id);


// ===============================
// ADMIN SETTINGS
// ===============================

const ADMIN_EMAIL = "ankur85428@gmail.com";

let isAdmin = false;


// ===============================
// FIREBASE DATABASE
// ===============================

const database = firebase.database();
const bookingsRef = database.ref("bookings");


// ===============================
// VARIABLES
// ===============================

let bookings = {};
let selectedSeat = null;


// ===============================
// ADMIN UI
// ===============================

function createAdminUI() {

  // Admin button
  if (!$("adminBtn")) {

    const header = document.querySelector(".topbar");

    if (header) {

      const adminBtn = document.createElement("button");

      adminBtn.id = "adminBtn";
      adminBtn.className = "theme-btn";
      adminBtn.textContent = "Admin";

      header.appendChild(adminBtn);
    }
  }


  // Logout button
  if (!$("logoutBtn")) {

    const header = document.querySelector(".topbar");

    if (header) {

      const logoutBtn = document.createElement("button");

      logoutBtn.id = "logoutBtn";
      logoutBtn.className = "theme-btn hidden";
      logoutBtn.textContent = "Logout";

      header.appendChild(logoutBtn);
    }
  }


  // Admin login panel
  if (!$("adminPanel")) {

    const panel = document.createElement("div");

    panel.id = "adminPanel";

    panel.className = "card hidden";

    panel.innerHTML = `
      <div class="heading">
        <div>
          <p class="eyebrow">ADMIN ACCESS</p>
          <h3>Admin Login</h3>
        </div>
      </div>

      <form id="adminLoginForm">

        <input
          id="adminEmail"
          type="email"
          placeholder="Admin Email"
          required
        >

        <input
          id="adminPassword"
          type="password"
          placeholder="Admin Password"
          required
        >

        <button type="submit">
          Login as Admin
        </button>

      </form>

      <div id="adminMessage" class="message"></div>
    `;

    document.body.insertBefore(
      panel,
      document.body.firstChild
    );
  }
}


// Create admin interface
createAdminUI();


// ===============================
// ADMIN ELEMENTS
// ===============================

const adminBtn = $("adminBtn");
const logoutBtn = $("logoutBtn");
const adminPanel = $("adminPanel");
const adminLoginForm = $("adminLoginForm");
const adminMessage = $("adminMessage");


// ===============================
// FIND BOOKING DETAILS SECTION
// ===============================

function getBookingDetailsSection() {

  const table = $("bookingTable");

  if (!table) return null;

  return table.closest(".card");
}


// ===============================
// UPDATE ADMIN UI
// ===============================

function updateAdminUI() {

  const bookingDetails = getBookingDetailsSection();

  if (isAdmin) {

    if (adminBtn) {
      adminBtn.classList.add("hidden");
    }

    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }

    if (adminPanel) {
      adminPanel.classList.add("hidden");
    }

    // Show booking details only for admin
    if (bookingDetails) {
      bookingDetails.classList.remove("hidden");
    }

    // Show clear button
    if ($("clearAll")) {
      $("clearAll").classList.remove("hidden");
    }

  } else {

    if (adminBtn) {
      adminBtn.classList.remove("hidden");
    }

    if (logoutBtn) {
      logoutBtn.classList.add("hidden");
    }

    if (adminPanel) {
      adminPanel.classList.add("hidden");
    }

    // Hide booking details from normal visitors
    if (bookingDetails) {
      bookingDetails.classList.add("hidden");
    }

    // Hide clear button
    if ($("clearAll")) {
      $("clearAll").classList.add("hidden");
    }
  }
}


// ===============================
// ADMIN LOGIN BUTTON
// ===============================

if (adminBtn) {

  adminBtn.onclick = () => {

    if (adminPanel) {
      adminPanel.classList.remove("hidden");
    }

    if (adminMessage) {
      adminMessage.textContent = "";
      adminMessage.className = "message";
    }
  };
}


// ===============================
// ADMIN LOGIN
// ===============================

if (adminLoginForm) {

  adminLoginForm.onsubmit = async e => {

    e.preventDefault();

    const email = $("adminEmail").value.trim();
    const password = $("adminPassword").value;


    // Check admin email
    if (email !== ADMIN_EMAIL) {

      adminMessage.textContent =
        "Invalid admin email.";

      adminMessage.className =
        "message error";

      return;
    }


    try {

      await firebase
        .auth()
        .signInWithEmailAndPassword(
          email,
          password
        );


      isAdmin = true;

      adminLoginForm.reset();

      updateAdminUI();

      show(
        "Admin login successful.",
        "success"
      );

    } catch (error) {

      console.error(error);

      adminMessage.textContent =
        "Invalid email or password.";

      adminMessage.className =
        "message error";
    }
  };
}


// ===============================
// ADMIN LOGOUT
// ===============================

if (logoutBtn) {

  logoutBtn.onclick = async () => {

    try {

      await firebase.auth().signOut();

      isAdmin = false;

      updateAdminUI();

      show(
        "Admin logged out.",
        "success"
      );

    } catch (error) {

      console.error(error);

      show(
        "Logout failed. Please try again.",
        "error"
      );
    }
  };
}


// ===============================
// SAVE BOOKINGS
// ===============================

function save() {

  return bookingsRef.set(bookings);
}


// ===============================
// RENDER SEATS
// ===============================

function renderSeats() {

  const seatMap = $("seatMap");

  if (!seatMap) return;

  seatMap.innerHTML = "";


  for (let i = 1; i <= TOTAL_SEATS; i++) {

    const b = document.createElement("button");

    b.className = "seat";

    b.type = "button";

    b.textContent = i;


    // Already booked
    if (bookings[i]) {

      b.classList.add("booked");

      b.disabled = true;

      b.title = "Already booked";
    }


    // Selected seat
    if (selectedSeat === i) {

      b.classList.add("selected");
    }


    b.onclick = () => selectSeat(i);


    seatMap.appendChild(b);
  }


  updateStats();
}


// ===============================
// SELECT SEAT
// ===============================

function selectSeat(i) {

  if (bookings[i]) return;

  selectedSeat = i;


  if ($("seat")) {
    $("seat").value = i;
  }


  if ($("selectedSeat")) {
    $("selectedSeat").textContent =
      "Seat " + i;
  }


  if ($("selectionBar")) {
    $("selectionBar").classList.remove("hidden");
  }


  renderSeats();
}


// ===============================
// USE SEAT BUTTON
// ===============================

if ($("useSeat")) {

  $("useSeat").onclick = () => {

    if ($("name")) {
      $("name").focus();
    }


    if ($("bookingForm")) {

      $("bookingForm").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }


    show(
      "Seat " +
      selectedSeat +
      " selected. Enter customer details to confirm.",
      ""
    );
  };
}


// ===============================
// UPDATE STATISTICS
// ===============================

function updateStats() {

  const n =
    Object.keys(bookings).length;


  if ($("bookedCount")) {

    $("bookedCount").textContent = n;
  }


  if ($("availableCount")) {

    $("availableCount").textContent =
      TOTAL_SEATS - n;
  }
}


// ===============================
// MESSAGE
// ===============================

function show(text, type) {

  if (!$("message")) return;

  $("message").textContent = text;

  $("message").className =
    "message " + type;
}


// ===============================
// VALIDATE SEAT
// ===============================

function validSeat(v) {

  const n = Number(v);

  return (
    Number.isInteger(n) &&
    n >= 1 &&
    n <= TOTAL_SEATS
  );
}


// ===============================
// BOOKING FORM
// ===============================

if ($("bookingForm")) {

  $("bookingForm").onsubmit =
    async e => {

      e.preventDefault();


      const name =
        $("name").value.trim();

      const phone =
        $("phone").value.trim();

      const seat =
        $("seat").value;


      // Name validation
      if (!name) {

        return show(
          "Customer name cannot be empty.",
          "error"
        );
      }


      // Phone empty
      if (!phone) {

        return show(
          "Phone number cannot be empty.",
          "error"
        );
      }


      // Phone validation
      if (!/^\d{10}$/.test(phone)) {

        return show(
          "Phone number must be exactly 10 digits.",
          "error"
        );
      }


      // Seat validation
      if (!validSeat(seat)) {

        return show(
          "Invalid seat number. Choose 1 to 20.",
          "error"
        );
      }


      const n = Number(seat);


      // Duplicate booking
      if (bookings[n]) {

        return show(
          "Seat " +
          n +
          " is already booked. Please select another seat.",
          "error"
        );
      }


      // Add booking
      bookings[n] = {

        name: name,

        phone: phone
      };


      try {

        await save();


        selectedSeat = null;


        if ($("selectionBar")) {

          $("selectionBar")
            .classList
            .add("hidden");
        }


        $("bookingForm").reset();


        renderSeats();


        if (isAdmin) {
          renderBookings();
        }


        show(
          "Seat " +
          n +
          " booked successfully.",
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
}


// ===============================
// RENDER BOOKINGS
// ===============================

function renderBookings() {

  // Only admin can see booking details
  if (!isAdmin) return;


  const body =
    $("bookingTable");

  if (!body) return;


  body.innerHTML = "";


  const seats =
    Object.keys(bookings)
      .map(Number)
      .sort(
        (a, b) => a - b
      );


  if (!seats.length) {

    body.innerHTML =
      '<tr><td colspan="4">No bookings found.</td></tr>';

    return;
  }


  seats.forEach(s => {

    const d = bookings[s];


    const tr =
      document.createElement("tr");


    tr.innerHTML = `

      <td>
        <b>${s}</b>
      </td>

      <td>
        ${safe(d.name)}
      </td>

      <td>
        ${safe(d.phone)}
      </td>

      <td>

        <button
          class="cancel"
          data-seat="${s}"
        >
          Cancel
        </button>

      </td>
    `;


    body.appendChild(tr);
  });


  document
    .querySelectorAll(".cancel")
    .forEach(x => {

      x.onclick = () =>
        cancelBooking(
          Number(x.dataset.seat)
        );
    });
}


// ===============================
// CANCEL BOOKING
// ===============================

async function cancelBooking(s) {

  if (!isAdmin) {

    return show(
      "Only admin can cancel bookings.",
      "error"
    );
  }


  if (!bookings[s]) {

    return show(
      "No booking exists for seat " +
      s +
      ".",
      "error"
    );
  }


  if (
    confirm(
      "Cancel booking for seat " +
      s +
      "?"
    )
  ) {

    const oldBooking =
      bookings[s];


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

      bookings[s] =
        oldBooking;


      console.error(error);


      show(
        "Cancellation failed. Please try again.",
        "error"
      );
    }
  }
}


// ===============================
// SEARCH BOOKING
// ===============================

function searchBooking() {

  // Only admin can search customer details
  if (!isAdmin) {

    const out = $("results");

    if (out) {

      out.className =
        "results muted";

      out.textContent =
        "Admin login required to search booking details.";
    }

    return;
  }


  const q =
    $("search").value
      .trim()
      .toLowerCase();

  const out =
    $("results");


  if (!q) {

    out.className =
      "results muted";

    out.textContent =
      "Please enter a name, phone or seat number.";

    return;
  }


  const matches =
    Object.entries(bookings)
      .filter(
        ([s, d]) =>
          s === q ||
          d.name
            .toLowerCase()
            .includes(q) ||
          d.phone
            .toLowerCase()
            .includes(q)
      );


  if (!matches.length) {

    out.className =
      "results muted";

    out.textContent =
      "No matching booking found.";

    return;
  }


  out.className =
    "results";


  out.innerHTML =
    matches
      .map(
        ([s, d]) => `

          <div class="result">

            <strong>
              Booking Found · Seat ${s}
            </strong>

            <br>

            Customer:
            ${safe(d.name)}

            <br>

            Phone:
            ${safe(d.phone)}

          </div>

        `
      )
      .join("");
}


// ===============================
// SEARCH BUTTON
// ===============================

if ($("searchBtn")) {

  $("searchBtn").onclick =
    searchBooking;
}


// ===============================
// SEARCH ENTER KEY
// ===============================

if ($("search")) {

  $("search").onkeydown =
    e => {

      if (e.key === "Enter") {

        searchBooking();
      }
    };
}


// ===============================
// CLEAR ALL BOOKINGS
// ===============================

if ($("clearAll")) {

  $("clearAll").onclick =
    async () => {

      if (!isAdmin) {

        return show(
          "Only admin can clear bookings.",
          "error"
        );
      }


      if (
        !Object.keys(bookings).length
      ) {

        return;
      }


      if (
        confirm(
          "Clear all current bookings?"
        )
      ) {

        const oldBookings =
          { ...bookings };


        bookings = {};


        try {

          await save();


          selectedSeat = null;


          if ($("selectionBar")) {

            $("selectionBar")
              .classList
              .add("hidden");
          }


          renderSeats();

          renderBookings();


          show(
            "All bookings cleared.",
            "success"
          );

        } catch (error) {

          bookings =
            oldBookings;


          console.error(error);


          show(
            "Could not clear bookings. Please try again.",
            "error"
          );
        }
      }
    };
}


// ===============================
// DARK / LIGHT THEME
// ===============================

if ($("themeBtn")) {

  $("themeBtn").onclick = () => {

    document.body
      .classList
      .toggle("dark");


    $("themeBtn").textContent =
      document.body
        .classList
        .contains("dark")
        ? "☀"
        : "☾";
  };
}


// ===============================
// SAFE HTML
// ===============================

function safe(v) {

  return String(v)
    .replace(
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


// ===============================
// FIREBASE AUTHENTICATION
// ===============================

// Anonymous login for normal visitors

firebase
  .auth()
  .signInAnonymously()
  .then(() => {

    console.log(
      "Anonymous authentication successful"
    );

  })
  .catch(error => {

    console.error(
      "Authentication failed:",
      error
    );
  });


// ===============================
// AUTH STATE
// ===============================

firebase
  .auth()
  .onAuthStateChanged(user => {

    if (
      user &&
      user.email === ADMIN_EMAIL
    ) {

      isAdmin = true;

    } else {

      isAdmin = false;
    }


    updateAdminUI();


    if (isAdmin) {

      renderBookings();
    }
  });


// ===============================
// REAL-TIME FIREBASE SYNC
// ===============================

bookingsRef.on(

  "value",

  snapshot => {

    bookings =
      snapshot.val() || {};


    renderSeats();


    // Only admin sees customer details
    if (isAdmin) {

      renderBookings();
    }
  },


  error => {

    console.error(error);


    show(
      "Could not connect to the booking database.",
      "error"
    );
  }
);