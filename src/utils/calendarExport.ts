/**
 * Generate an .ics file content from an appointment
 */
export function generateICS(appointment: {
  type: string;
  date: string;
  time?: string | null;
  notes?: string | null;
  horseName?: string | null;
}): string {
  const { type, date, time, notes, horseName } = appointment;

  // Parse date
  const [year, month, day] = date.split("-").map(Number);
  let dtStart: string;
  let dtEnd: string;

  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    dtStart = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
    // 1 hour duration
    const endH = hours + 1;
    dtEnd = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}T${String(endH).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
  } else {
    dtStart = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
    dtEnd = dtStart;
  }

  const summary = horseName ? `${type} – ${horseName}` : type;
  const description = notes ? notes.replace(/\n/g, "\\n") : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HuufiApp//DE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
    time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
