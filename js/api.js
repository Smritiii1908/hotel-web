// This helper keeps the site working in two modes:
// 1) Full-stack mode (Express backend available)
// 2) Static mode (GitHub Pages / no backend)
(function () {
  const STATIC_USERS_KEY = "hotelStaticUsers";
  const STATIC_BOOKINGS_KEY = "hotelStaticBookings";

  const isGitHubPages = window.location.hostname.includes("github.io");

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isDateRangeValid(checkIn, checkOut) {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return !Number.isNaN(inDate.getTime()) && !Number.isNaN(outDate.getTime()) && inDate < outDate;
  }

  function isOverlapping(inA, outA, inB, outB) {
    const startA = new Date(inA).getTime();
    const endA = new Date(outA).getTime();
    const startB = new Date(inB).getTime();
    const endB = new Date(outB).getTime();
    return startA < endB && startB < endA;
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  async function loadLocalRooms() {
    const res = await fetch("data/rooms.json");
    const rooms = await res.json();
    return Array.isArray(rooms) ? rooms : [];
  }

  async function staticGetRooms({ checkIn, checkOut, guests } = {}) {
    const rooms = await loadLocalRooms();
    const bookings = readStorage(STATIC_BOOKINGS_KEY);
    const guestCount = Number(guests) || 1;

    let filtered = rooms.filter((room) => room.capacity >= guestCount);

    if (checkIn && checkOut && isDateRangeValid(checkIn, checkOut)) {
      filtered = filtered.filter((room) => {
        const conflict = bookings.some(
          (booking) =>
            booking.roomId === room.id &&
            isOverlapping(checkIn, checkOut, booking.checkIn, booking.checkOut)
        );
        return !conflict;
      });
    }

    return { success: true, count: filtered.length, rooms: filtered };
  }

  async function staticCreateBooking(payload) {
    const rooms = await loadLocalRooms();
    const bookings = readStorage(STATIC_BOOKINGS_KEY);
    const selectedRoom = rooms.find((room) => room.id === payload.roomId);

    if (!selectedRoom) {
      return { success: false, message: "Selected room was not found." };
    }

    const conflict = bookings.find(
      (b) =>
        b.roomId === payload.roomId &&
        isOverlapping(payload.checkIn, payload.checkOut, b.checkIn, b.checkOut)
    );

    if (conflict) {
      return { success: false, message: "Room is not available for the selected dates." };
    }

    const booking = {
      id: generateId("BK"),
      roomId: payload.roomId,
      roomName: selectedRoom.name,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      guests: Number(payload.guests),
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    writeStorage(STATIC_BOOKINGS_KEY, bookings);

    return { success: true, message: "Booking confirmed successfully!", booking };
  }

  async function staticSignup(payload) {
    const users = readStorage(STATIC_USERS_KEY);
    const exists = users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());

    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }

    const user = { id: generateId("USR"), name: payload.name, email: payload.email };
    users.push({ ...user, password: payload.password });
    writeStorage(STATIC_USERS_KEY, users);

    return { success: true, message: "Signup successful.", user };
  }

  async function staticLogin(payload) {
    const users = readStorage(STATIC_USERS_KEY);
    const user = users.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase() && u.password === payload.password
    );

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    return {
      success: true,
      message: "Login successful.",
      user: { id: user.id, name: user.name, email: user.email }
    };
  }

  async function tryServerRequest(url, options) {
    const res = await fetch(url, options);
    return res.json();
  }

  async function getRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/rooms?${query}` : "/api/rooms";

    if (isGitHubPages) {
      return staticGetRooms(params);
    }

    try {
      return await tryServerRequest(endpoint);
    } catch {
      return staticGetRooms(params);
    }
  }

  async function createBooking(payload) {
    if (isGitHubPages) {
      return staticCreateBooking(payload);
    }

    try {
      return await tryServerRequest("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      return staticCreateBooking(payload);
    }
  }

  async function signup(payload) {
    if (isGitHubPages) {
      return staticSignup(payload);
    }

    try {
      return await tryServerRequest("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      return staticSignup(payload);
    }
  }

  async function login(payload) {
    if (isGitHubPages) {
      return staticLogin(payload);
    }

    try {
      return await tryServerRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      return staticLogin(payload);
    }
  }

  window.HotelAPI = {
    getRooms,
    createBooking,
    signup,
    login
  };
})();
