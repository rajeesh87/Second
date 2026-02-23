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
const confettiLayer = document.getElementById("confettiLayer");
const successPrompt = document.getElementById("successPrompt");

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

function launchConfetti() {
  if (!confettiLayer) return;

  const colors = ["#ff77b8", "#ffd45d", "#8fdcff", "#b999ff", "#7be38f", "#ff9f68"];
  const pieces = 84;

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty("--duration", `${1800 + Math.random() * 1600}ms`);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 3800);
}

function showSuccessPrompt() {
  if (!successPrompt) return;
  successPrompt.textContent = "🎉 RSVP Received! See you at the celebration.";
  successPrompt.classList.add("show");
  setTimeout(() => {
    successPrompt.classList.remove("show");
  }, 2800);
}

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
    attendance: document.getElementById("attendance").value,
    adults: Number(document.getElementById("adults").value),
    kids: Number(document.getElementById("kids").value),
    message: document.getElementById("message").value.trim()
  };

  if (payload.attendance === "yes" && payload.adults + payload.kids <= 0) {
    status.textContent = "For 'Yes' attendance, Adults or Kids must be greater than 0.";
    status.style.color = "#a13f5e";
    return;
  }

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
    if (payload.attendance === "yes") {
      launchConfetti();
      showSuccessPrompt();
    }
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
