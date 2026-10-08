// Helpers for class dates and times. Classes store their date as text like
// "Thursday, October 8, 2026" and their time as "8:00 AM - 9:00 AM".

const DAY_MS = 24 * 60 * 60 * 1000;

// Parses the stored date text. The weekday is removed first because some
// browsers (Safari) can't parse it.
export const parseClassDate = (text) => {
    const date = new Date(String(text ?? "").replace(/^[A-Za-z]+,\s*/, ""));
    return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const dayKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "2026-10-08" -> Date (local time), as used by <input type="date">.
export const fromDayKey = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
};

export const formatClassDate = (date) => date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
});

export const daysFromToday = (date) => Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS);

export const relativeDayLabel = (date) => {
    const offset = daysFromToday(date);
    if (offset === 0) return "Today";
    if (offset === 1) return "Tomorrow";
    if (offset === -1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

export const shortDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// "13:05" -> "1:05 PM"
export const formatTime = (value) => {
    const [hours, minutes] = String(value).split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

// "1:05 PM" (or the older "1:5 PM") -> "13:05"
const to24h = (text) => {
    const match = String(text).trim().match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
    if (!match) return "";
    let hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${match[2].padStart(2, "0")}`;
};

export const formatTimeRange = (from, to) => `${formatTime(from)} - ${formatTime(to)}`;

export const parseTimeRange = (text) => {
    const [from = "", to = ""] = String(text ?? "").split("-").map(to24h);
    return { from, to };
};

// Cleans up older times stored without zero padding, e.g. "8:0 AM - 9:0 AM".
export const displayTime = (text) => {
    const { from, to } = parseTimeRange(text);
    return from && to ? formatTimeRange(from, to) : text;
};

const startMinutes = (record) => {
    const [hours, minutes] = (parseTimeRange(record.time).from || "00:00").split(":").map(Number);
    return hours * 60 + minutes;
};

// Groups classes by day: [{ key, date, label, items }], items sorted by start time.
export const groupByDay = (records = [], order = "asc") => {
    const groups = new Map();
    for (const record of records) {
        const date = parseClassDate(record.date);
        if (!date) continue;
        const key = dayKey(date);
        if (!groups.has(key)) groups.set(key, { key, date, label: relativeDayLabel(date), items: [] });
        groups.get(key).items.push(record);
    }
    const sorted = [...groups.values()].sort((a, b) => (order === "asc" ? a.date - b.date : b.date - a.date));
    sorted.forEach((group) => group.items.sort((a, b) => startMinutes(a) - startMinutes(b)));
    return sorted;
};

export const isUpcoming = (record) => {
    const date = parseClassDate(record.date);
    return date ? daysFromToday(date) >= 0 : false;
};

export const isPast = (record) => {
    const date = parseClassDate(record.date);
    return date ? daysFromToday(date) < 0 : false;
};

export const isToday = (record) => {
    const date = parseClassDate(record.date);
    return date ? daysFromToday(date) === 0 : false;
};

export const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export const uniqueSections = (records = []) =>
    [...new Set(records.map((record) => record.section).filter(Boolean))].sort((a, b) => a.localeCompare(b));
