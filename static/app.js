async function toggleHabit(checkbox) {
  const habitId = checkbox.dataset.habitId;
  const logDate = checkbox.dataset.logDate;

  await fetch(`/habits/${habitId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      log_date: logDate,
      completed: checkbox.checked ? "1" : "0",
    }),
  });

  window.location.reload();
}

document.querySelectorAll('input[type="checkbox"][data-habit-id]').forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    toggleHabit(checkbox);
  });
});
