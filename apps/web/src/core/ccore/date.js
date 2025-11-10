// Små datumhjälpare (ingen beroende på externa lib)
export function fmtDateISO(d) {
  return d.toISOString().slice(0, 10);
}
export function parseISO(s) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
}
export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
export function dayOfWeek(d) {
  return d.getDay(); // 0=Sun .. 6=Sat
}
