document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper para evitar inyección de HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and avoid duplicate options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Construir lista de participantes (o mensaje cuando está vacío)
        let participantsHtml = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          // Build list items with a delete button for each participant
          participantsHtml = `<ul class="participants-list">` +
            details.participants.map(p => {
              const label = escapeHtml(p);
              const initials = escapeHtml(String(p).trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase());
              // data-email will be used to identify the participant when deleting
              return `<li class="participant-item" data-email="${label}" data-activity="${escapeHtml(name)}">` +
                `<span class="participant-avatar">${initials}</span>` +
                `<span class="participant-name">${label}</span>` +
                `<button class="participant-delete" title="Remove participant" aria-label="Remove ${label}">\u2716</button>` +
                `</li>`;
            }).join("") +
            `</ul>`;
        } else {
          participantsHtml = `<div class="no-participants">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

        // Attach delete handlers for participant delete buttons
        document.querySelectorAll('.participant-delete').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const li = btn.closest('.participant-item');
            if (!li) return;
            const participantEmail = li.getAttribute('data-email');
            const activityName = li.getAttribute('data-activity');

            if (!participantEmail || !activityName) return;

            if (!confirm(`Remove ${participantEmail} from ${activityName}?`)) return;

            try {
              const url = `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`;
              const resp = await fetch(url, { method: 'DELETE' });
              const result = await resp.json();
              if (resp.ok) {
                // refresh activities list
                fetchActivities();
              } else {
                console.error('Failed to remove participant', result);
                alert(result.detail || result.message || 'Failed to remove participant');
              }
            } catch (err) {
              console.error('Error removing participant', err);
              alert('Failed to remove participant. See console for details.');
            }
          });
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list so the newly registered participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
