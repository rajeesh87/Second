const music = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const form = document.getElementById("rsvpForm");
const status = document.getElementById("status");
const submitButton = document.querySelector(".submit");
const countdown = document.getElementById("countdown");
const cdDays = document.getElementById("cdDays");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");

let manualPause = false;

async function playMusic() {
  try {
    await music.play();
    musicToggle.textContent = "Pause Music";
    musicToggle.setAttribute("aria-pressed", "true");
  } catch {
    musicToggle.textContent = "Play Music";
    musicToggle.setAttribute("aria-pressed", "false");
  }
}

function pauseMusic() {
  music.pause();
  musicToggle.textContent = "Play Music";
  musicToggle.setAttribute("aria-pressed", "false");
}

// Try autoplay; many browsers block it until a user interaction.
playMusic();
document.addEventListener("DOMContentLoaded", playMusic, { once: true });
window.addEventListener("load", playMusic, { once: true });
music.addEventListener("canplay", playMusic, { once: true });

musicToggle.addEventListener("click", async () => {
  if (music.paused) {
    manualPause = false;
    await playMusic();
  } else {
    manualPause = true;
    pauseMusic();
  }
});

// If autoplay is blocked, start on first interaction unless user manually paused.
["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
  document.addEventListener(
    eventName,
    () => {
      if (!manualPause && music.paused) {
        playMusic();
      }
    },
    { once: true, passive: true }
  );
});

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden && !music.paused) {
      music.pause();
    } else if (!document.hidden && !manualPause) {
      playMusic();
    }
  },
  { passive: true }
);

const partyDate = new Date("2026-04-11T18:00:00-04:00");

function updateCountdown() {
  const now = new Date();
  const diff = partyDate.getTime() - now.getTime();

  if (diff <= 0) {
    if (countdown) {
      countdown.innerHTML = "<div class=\"count-item\"><span>Today</span><small>Party Time!</small></div>";
    }
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  cdDays.textContent = String(days).padStart(2, "0");
  cdHours.textContent = String(hours).padStart(2, "0");
  cdMinutes.textContent = String(minutes).padStart(2, "0");
  cdSeconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    status.textContent = "Please fill out required fields before sending RSVP.";
    status.style.color = "#a13f5e";
    return;
  }

  const payload = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    attendance: document.getElementById("attendance").value,
    adults: Number(document.getElementById("adults").value),
    kids: Number(document.getElementById("kids").value),
    message: document.getElementById("message").value.trim()
  };

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  status.textContent = "Sending RSVP...";
  status.style.color = "#4f3c75";

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unable to send RSVP right now.");
    }

    const guestName = payload.name || "Guest";
    status.textContent = `Thank you, ${guestName}. RSVP sent successfully.`;
    status.style.color = "#3f7a44";
    form.reset();
  } catch (error) {
    const isNetworkFailure =
      error instanceof TypeError && error.message.toLowerCase().includes("fetch");
    if (isNetworkFailure) {
      status.textContent =
        "RSVP service is not reachable right now. If running locally, start the server with npm start. If hosted, check deployment/API settings.";
    } else {
      status.textContent = error.message || "Something went wrong while sending RSVP.";
    }
    status.style.color = "#a13f5e";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send RSVP";
  }
});
