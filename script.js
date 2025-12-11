function $(id) { return document.getElementById(id); }
function fmt(n, d = 2) { return (Math.round(n * 10**d) / 10**d).toLocaleString(); }

function calculate() {
  const d = {
    project: $("projectName").value,
    kloc: +$("kloc").value,
    loc: +$("loc").value,
    pm: +$("personMonths").value,
    defPre: +$("defPre").value,
    defPost: +$("defPost").value,
    tests: +$("testsTotal").value,
    pass: +$("testsPass").value,
    linesTested: +$("linesTested").value,
    linesTotal: +$("totalLines").value,
    hoursOp: +$("hoursOp").value,
    failures: +$("failures").value,
    downtime: +$("downtime").value,
    repairs: +$("repairs").value,
    tp: +$("tp").value,
    fp: +$("fp").value,
    fn: +$("fn").value,
    tn: +$("tn").value
  };

  if (!d.kloc) d.kloc = d.loc / 1000;

  // MÉTRICAS
  const defTotal = d.defPre + d.defPost;
  const dens = defTotal / d.kloc;
  const dre = d.defPre / (defTotal || 1);
  const cov = d.linesTested / (d.linesTotal || 1);
  const passRate = d.pass / (d.tests || 1);
  const mttr = d.downtime / d.repairs;
  const mtbf = d.hoursOp / (d.failures || 1);
  const avail = mtbf / (mtbf + mttr);

  const precision = d.tp / ((d.tp + d.fp) || 1);
  const recall = d.tp / ((d.tp + d.fn) || 1);
  const f1 = 2 * precision * recall / ((precision + recall) || 1);

  // Crear gráfico Radar
const radar = $("radarChart");

if (window.radarChartInstance) {
  window.radarChartInstance.destroy();
}

window.radarChartInstance = new Chart(radar, {
  type: "radar",
  data: {
    labels: ["DRE", "Disponibilidad", "Cobertura", "F1 Score", "Pass Rate"],
    datasets: [{
      label: "Calidad del Software (%)",
      data: [
        dre * 100,
        avail * 100,
        cov * 100,
        f1 * 100,
        passRate * 100
      ],
      fill: true,
      backgroundColor: "rgba(99, 102, 241, 0.3)",
      borderColor: "#6366f1",
      pointBackgroundColor: "#fff",
      pointBorderColor: "#6366f1",
      pointHoverBackgroundColor: "#6366f1"
    }]
  },
  options: {
    responsive: true,
    scales: {
      r: {
        angleLines: { color: "#475569" },
        grid: { color: "#334155" },
        pointLabels: { color: "#cbd5e1", font: { size: 13 } },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: { labels: { color: "#e2e8f0" } }
    }
  }
});


  // TARJETAS
  const grid = $("metricsGrid");
  grid.innerHTML = "";

  function card(title, value, badge) {
    grid.innerHTML += `
      <div class="metric-card">
        <div>${title}</div>
        <div class="metric-value">${value}</div>
        ${badge}
      </div>`;
  }

  const badge = (v, good, warn) =>
    v >= good ? '<span class="badge good">Bueno</span>' :
    v >= warn ? '<span class="badge warn">Advertencia</span>' :
               '<span class="badge bad">Crítico</span>';

  card("Densidad de defectos", fmt(dens), badge(1/dens, 0.2, 0.05));
  card("DRE", fmt(dre*100)+"%", badge(dre, 0.95, 0.80));
  card("Disponibilidad", fmt(avail*100)+"%", badge(avail, 0.995, 0.98));
  card("Cobertura de pruebas", fmt(cov*100)+"%", badge(cov, 0.8, 0.5));
  card("F1 Score", fmt(f1*100)+"%", badge(f1, 0.7, 0.5));

  // REPORTE EJECUTIVO
  $("executiveReport").innerHTML = `
📌 <strong>${d.project}</strong><br><br>

🟦 <strong>Calidad general:</strong> ${dre > 0.9 ? "Alta" : "Mejorable"}<br>
🟦 <strong>Confiabilidad:</strong> ${fmt(avail*100)}% disponibilidad<br>
🟦 <strong>Pruebas:</strong> ${fmt(cov*100)}% cobertura<br><br>

<b>Recomendaciones:</b><br>
${dre < 0.8 ? "• Incrementar pruebas antes de release.<br>" : "• Buen control de calidad.<br>"}
${cov < 0.5 ? "• Aumentar pruebas automatizadas.<br>" : "• Cobertura suficiente.<br>"}
${avail < 0.98 ? "• Revisar arquitectura para reducir downtime.<br>" : "• Disponibilidad aceptable.<br>"}
  `;

  // REPORTE TÉCNICO
  $("technicalReport").textContent =
`--- Reporte Técnico ---

Densidad de defectos: ${fmt(dens)}
DRE: ${fmt(dre*100)}%
Disponibilidad: ${fmt(avail*100)}%
Cobertura de pruebas: ${fmt(cov*100)}%
F1 Score: ${fmt(f1*100)}%

MTTR: ${fmt(mttr)}
MTBF: ${fmt(mtbf)}
Precision: ${fmt(precision*100)}%
Recall: ${fmt(recall*100)}%
`;
}

// PDF
$("pdfBtn").onclick = () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ compress: false });

  pdf.setFont("Helvetica", "normal");

  pdf.setFontSize(18);
  pdf.text("Reporte de Métricas de Calidad", 10, 15);

  const exec = $("executiveReport").innerText;
  const tech = $("technicalReport").innerText;

  pdf.setFontSize(13);
  pdf.text(exec.split("\n"), 10, 30);

  pdf.text(tech.split("\n"), 10, 140);

  pdf.save("reporte_metricas.pdf");
};


// Eventos
$("calcBtn").onclick = calculate;
$("resetBtn").onclick = () => location.reload();

calculate(); // inicial
