document.addEventListener("DOMContentLoaded", () => {
  loadRooms();
  setupRoomFilterForm();
});

async function loadRooms(params = {}) {
  const container = document.getElementById("roomsContainer");
  if (!container) return;

  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/api/rooms?${query}` : "/api/rooms";

  try {
    const response = await fetch(endpoint);
    const result = await response.json();

    if (!result.success || !Array.isArray(result.rooms)) {
      container.innerHTML = '<p class="muted">Unable to load rooms at the moment.</p>';
      return;
    }

    if (result.rooms.length === 0) {
      container.innerHTML = '<p class="muted">No rooms matched your filter.</p>';
      return;
    }

    container.innerHTML = result.rooms
      .map(
        (room) => `
        <article class="room-card fade-in">
          <img src="${room.image}" alt="${room.name}" />
          <div class="room-content">
            <h3>${room.name}</h3>
            <p class="price">$${room.price} / night</p>
            <p class="muted">${room.description}</p>
            <div class="amenities">
              ${room.amenities.map((a) => `<span class="amenity">${a}</span>`).join("")}
            </div>
          </div>
        </article>
      `
      )
      .join("");
  } catch {
    container.innerHTML = '<p class="muted">Server unavailable. Please try again later.</p>';
  }
}

function setupRoomFilterForm() {
  const form = document.getElementById("roomFilterForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    const guests = document.getElementById("guests").value;

    loadRooms({ checkIn, checkOut, guests });
  });
}
