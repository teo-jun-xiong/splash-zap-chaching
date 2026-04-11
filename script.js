document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

async function fetchData() {
  try {
    const response = await fetch("data.csv");
    if (!response.ok) throw new Error("Could not fetch data.csv");
    const csvText = await response.text();
    processData(csvText);
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("header-total-amount").textContent = "ERROR";
  }
}

function processData(csvText) {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");
  if (lines.length <= 1) return; // Only headers

  // Parse lines avoiding headers
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((item) => item.trim());
    if (cols.length >= 5) {
      // Month,Electric,Water,DueDate,Total
      data.push({
        month: cols[0],
        electric: parseFloat(cols[1]) || 0,
        water: parseFloat(cols[2]) || 0,
        dueDate: cols[3],
        total: parseFloat(cols[4]) || 0,
      });
    }
  }

  // Ensure chronological order by parsing Month (Assume format YYYY/MM or MM/YYYY)
  // Let's standardise the sorting based on just the literal string if YYYY/MM, or parsing if needed.
  // Because the CSV has format "YYYY/MM" based on the uploaded data.
  data.sort((a, b) => {
    // If format is YYYY/MM, a simple string compare works perfectly!
    return a.month.localeCompare(b.month);
  });

  // Display top total
  if (data.length > 0) {
    const latest = data[data.length - 1];
    document.getElementById("header-total-amount").textContent =
      `$${latest.total.toFixed(2)}`;
  }

  // Render
  renderTable(data);
  renderChart(data);
}

function renderTable(data) {
  const tbody = document.getElementById("billsTableBody");
  tbody.innerHTML = "";

  // Show newest first in table
  const reversedData = [...data].reverse();

  reversedData.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>$${row.electric.toFixed(2)}</td>
      <td>$${row.water.toFixed(2)}</td>
      <td>$${row.total.toFixed(2)}</td>
      <td>${row.dueDate || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(data) {
  const ctx = document.getElementById("utilitiesChart").getContext("2d");

  const labels = data.map((d) => d.month);
  const electricData = data.map((d) => d.electric);
  const waterData = data.map((d) => d.water);
  // const totalData = data.map(d => d.total);

  // Styling
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.font.family = "Inter";

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Electric",
          data: electricData,
          borderColor: "#fbbf24",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#fbbf24",
          pointBorderWidth: 0,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Water",
          data: waterData,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#38bdf8",
          pointBorderWidth: 0,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { boxWidth: 12, usePointStyle: true, padding: 20 },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null)
                label += "$" + context.parsed.y.toFixed(2);
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
          ticks: { maxTicksLimit: 12 },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.05)", drawBorder: false },
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "$" + value;
            },
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
    },
  });
}
