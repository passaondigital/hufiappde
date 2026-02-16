import jsPDF from "jspdf";

interface AnalysisResult {
  symmetryScore: number;
  lamenessIndex: number;
  beatClarity: number;
  symmetryDesc: string;
  lamenessDesc: string;
  beatDesc: string;
  aiNote: string;
}

export function exportAnalysisPDF(result: AnalysisResult, lang: string = "de") {
  const isEn = lang.startsWith("en");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header bar
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, w, 38, "F");
  doc.setFillColor(224, 120, 40);
  doc.rect(0, 38, w, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("HuufiApp", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(isEn ? "Motion Analysis Report" : "Bewegungsanalyse-Protokoll", margin, 28);

  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString(isEn ? "en-GB" : "de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), w - margin, 28, { align: "right" });

  y = 52;

  // Metrics section
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(isEn ? "Analysis Results" : "Analyse-Ergebnisse", margin, y);
  y += 10;

  const metrics = [
    { label: isEn ? "Symmetry Score" : "Symmetrie-Score", value: `${result.symmetryScore}%`, desc: result.symmetryDesc, warn: result.symmetryScore < 85 },
    { label: isEn ? "Lameness Index" : "Lahmheits-Index", value: result.lamenessIndex.toString(), desc: result.lamenessDesc, warn: result.lamenessIndex > 1.5 },
    { label: isEn ? "Beat Clarity" : "Taktklarheit", value: `${result.beatClarity}%`, desc: result.beatDesc, warn: false },
  ];

  const boxW = (w - margin * 2 - 10) / 3;
  metrics.forEach((m, i) => {
    const bx = margin + i * (boxW + 5);
    // Box background
    doc.setFillColor(m.warn ? 255 : 245, m.warn ? 240 : 245, m.warn ? 240 : 245);
    doc.roundedRect(bx, y, boxW, 36, 3, 3, "F");
    doc.setDrawColor(m.warn ? 220 : 230, m.warn ? 180 : 230, m.warn ? 180 : 230);
    doc.roundedRect(bx, y, boxW, 36, 3, 3, "S");

    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(m.label, bx + 5, y + 9);

    // Value
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(m.warn ? 200 : 30, m.warn ? 60 : 30, m.warn ? 60 : 30);
    doc.text(m.value, bx + 5, y + 23);

    // Description
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(m.desc, bx + 5, y + 31);
  });

  y += 48;

  // AI Note
  doc.setFillColor(255, 248, 235);
  doc.setDrawColor(224, 180, 100);
  doc.roundedRect(margin, y, w - margin * 2, 28, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 100, 20);
  doc.text(isEn ? "⚠ AI Assessment" : "⚠ KI-Bewertung", margin + 5, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 60, 30);
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(result.aiNote, w - margin * 2 - 10);
  doc.text(lines, margin + 5, y + 17);

  y += 38;

  // Symmetry gauge visualization
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(isEn ? "Symmetry Analysis" : "Symmetrie-Analyse", margin, y);
  y += 8;

  // Simple bar gauge
  const gaugeW = w - margin * 2;
  const gaugeH = 10;

  // Background
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin, y, gaugeW, gaugeH, 2, 2, "F");

  // Fill based on score
  const fillW = (result.symmetryScore / 100) * gaugeW;
  const r = result.symmetryScore < 85 ? 220 : 60;
  const g = result.symmetryScore < 85 ? 80 : 180;
  const b = result.symmetryScore < 85 ? 60 : 80;
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y, fillW, gaugeH, 2, 2, "F");

  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`${result.symmetryScore}%`, margin + fillW - 12, y + 7);

  y += 16;

  // Lameness scale
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(isEn ? "Lameness Scale (0-5)" : "Lahmheits-Skala (0–5)", margin, y);
  y += 8;

  for (let i = 0; i < 5; i++) {
    const segW = gaugeW / 5;
    const segX = margin + i * segW;
    const active = result.lamenessIndex >= i && result.lamenessIndex < i + 1;
    doc.setFillColor(active ? 224 : 240, active ? 120 : 240, active ? 40 : 240);
    doc.rect(segX + 1, y, segW - 2, 8, "F");
    doc.setFontSize(6);
    doc.setTextColor(active ? 255 : 150, active ? 255 : 150, active ? 255 : 150);
    doc.text(`${i}`, segX + segW / 2, y + 5.5, { align: "center" });
  }

  y += 18;

  // Disclaimer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, w - margin, y);
  y += 6;

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(140, 140, 140);
  const disclaimer = isEn
    ? "This report was generated automatically by HuufiApp motion analysis. It does not replace a veterinary diagnosis. All data should be verified by a qualified professional."
    : "Dieser Bericht wurde automatisch durch die HuufiApp-Bewegungsanalyse erstellt. Er ersetzt keine tierärztliche Diagnose. Alle Daten sollten von einer Fachperson überprüft werden.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, w - margin * 2);
  doc.text(disclaimerLines, margin, y);

  y += 14;

  // Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("© 2026 HuufiApp · PASSA ON Digital · huufiapp.de", margin, doc.internal.pageSize.getHeight() - 10);
  doc.text(`ID: ${crypto.randomUUID().slice(0, 8).toUpperCase()}`, w - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });

  // Save
  const filename = `HuufiApp_${isEn ? "Analysis" : "Analyse"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
