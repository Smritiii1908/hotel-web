// Shared navbar behavior for mobile menu and active page links.
document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  markActiveNavLink();
  setDateDefaults();
  setupHomeBookingSearch();
  setupContactForm();
  renderUserGreeting();
  setupLogoutButtons();
  setup3DInteractions();
});

function setupMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

function markActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    }
  });
}

function setDateDefaults() {
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");
  if (!checkInInput || !checkOutInput) return;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  checkInInput.min = formatDate(today);
  checkOutInput.min = formatDate(tomorrow);

  if (!checkInInput.value) checkInInput.value = formatDate(today);
  if (!checkOutInput.value) checkOutInput.value = formatDate(tomorrow);

  checkInInput.addEventListener("change", () => {
    const selectedIn = new Date(checkInInput.value);
    selectedIn.setDate(selectedIn.getDate() + 1);
    checkOutInput.min = formatDate(selectedIn);

    if (checkOutInput.value <= checkInInput.value) {
      checkOutInput.value = formatDate(selectedIn);
    }
  });
}

function setupHomeBookingSearch() {
  const form = document.getElementById("homeBookingForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    const guests = document.getElementById("guests").value;
    const roomList = document.getElementById("availableRooms");

    try {
      const result = await window.HotelAPI.getRooms({ checkIn, checkOut, guests });

      if (!result.success) {
        showMessage("bookingMessage", "Unable to fetch available rooms.", "error");
        return;
      }

      if (roomList) {
        roomList.innerHTML = "";

        if (result.rooms.length === 0) {
          roomList.innerHTML = '<p class="muted">No rooms available for selected dates. Please try other dates.</p>';
        } else {
          result.rooms.forEach((room) => {
            const card = createRoomCard(room, checkIn, checkOut, guests);
            roomList.appendChild(card);
          });
        }
      }

      showMessage("bookingMessage", `Found ${result.rooms.length} room(s) for your stay.`, "success");
    } catch (error) {
      showMessage("bookingMessage", "Server error. Please try again.", "error");
    }
  });
}

function createRoomCard(room, checkIn, checkOut, guests) {
  const card = document.createElement("article");
  card.className = "room-card fade-in floating-3d tilt-card";

  card.innerHTML = `
    <img src="${room.image}" alt="${room.name}" />
    <div class="room-content">
      <h3>${room.name}</h3>
      <p class="price">$${room.price} / night</p>
      <p class="muted">${room.description}</p>
      <div class="amenities">
        ${room.amenities.map((item) => `<span class="amenity">${item}</span>`).join("")}
      </div>
      <button type="button" data-room-id="${room.id}" style="margin-top: 1rem; width: 100%;">Book This Room</button>
    </div>
  `;

  const bookButton = card.querySelector("button");
  bookButton.addEventListener("click", () => {
    openQuickBooking(room, checkIn, checkOut, guests);
  });

  return card;
}

function openQuickBooking(room, checkIn, checkOut, guests) {
  const guestName = prompt(`Booking ${room.name}\nPlease enter your full name:`);
  if (!guestName) return;

  const email = prompt("Please enter your email:");
  if (!email) return;

  const phone = prompt("Please enter phone number (optional):") || "";

  const user = getCurrentUser();

  window.HotelAPI
    .createBooking({
      roomId: room.id,
      name: guestName,
      email,
      phone,
      checkIn,
      checkOut,
      guests: Number(guests),
      userId: user ? user.id : null
    })
    .then((data) => {
      if (!data.success) {
        showMessage("bookingMessage", data.message || "Booking failed.", "error");
        return;
      }

      showMessage(
        "bookingMessage",
        `Booking confirmed! Your reference is ${data.booking.id} for ${data.booking.roomName}.`,
        "success"
      );
    })
    .catch(() => {
      showMessage("bookingMessage", "Unable to complete booking. Please try again.", "error");
    });
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showMessage("contactMessage", "Thank you! We received your message and will contact you shortly.", "success");
    form.reset();
  });
}

function renderUserGreeting() {
  const userBadge = document.getElementById("userBadge");
  const loginLink = document.getElementById("loginLink");
  const signupLink = document.getElementById("signupLink");
  if (!userBadge) return;

  const user = getCurrentUser();
  if (user) {
    userBadge.textContent = `Welcome, ${user.name}`;
    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";
  } else {
    userBadge.textContent = "Guest Visitor";
  }
}

function setupLogoutButtons() {
  document.querySelectorAll("[data-logout='true']").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem("hotelUser");
      window.location.reload();
    });
  });
}

// Adds subtle 3D tilt effect for premium visual feel.
function setup3DInteractions() {
  const cards = document.querySelectorAll(".card, .room-card, .gallery-grid img");
  cards.forEach((card) => {
    card.classList.add("tilt-card");

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateY = ((x - midX) / midX) * 5;
      const rotateX = -((y - midY) / midY) * 5;

      card.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function getCurrentUser() {
  const raw = localStorage.getItem("hotelUser");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function showMessage(id, text, type) {
  const messageBox = document.getElementById(id);
  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
