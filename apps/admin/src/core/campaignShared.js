// apps/admin/src/core/campaignShared.js

export const CAMPAIGNS = [
  { id: "jan-refresh", label: "New Year Refresh", from: { month: 1, day: 1 }, to: { month: 1, day: 14 }, priority: 10 },
  { id: "valentines", label: "Calestra Amoré", from: { month: 2, day: 7 }, to: { month: 2, day: 15 }, priority: 20 },
  { id: "ramadan", label: "Ramadan Lights", from: { month: 3, day: 1 }, to: { month: 4, day: 15 }, priority: 30 },
  { id: "eid", label: "Eid Celebration", from: { month: 4, day: 16 }, to: { month: 4, day: 25 }, priority: 40 },
  { id: "summer", label: "Calestra Travel Light", from: { month: 6, day: 1 }, to: { month: 8, day: 15 }, priority: 5 },
  { id: "black-week", label: "Black Week", from: { month: 11, day: 20 }, to: { month: 11, day: 30 }, priority: 90 },
  { id: "xmas", label: "Calestra Winter Lights", from: { month: 12, day: 1 }, to: { month: 12, day: 26 }, priority: 100 },
  { id: "newyear", label: "New Year Spark", from: { month: 12, day: 27 }, to: { month: 1, day: 3 }, wrapsYear: true, priority: 95 },
];

function isActive(c, date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const fm = c.from.month, fd = c.from.day;
  const tm = c.to.month, td = c.to.day;
  const wraps = c.wrapsYear || fm > tm || (fm === tm && fd > td);

  if (!wraps) {
    if (m < fm || m > tm) return false;
    if (m === fm && d < fd) return false;
    if (m === tm && d > td) return false;
    return true;
  }
  const afterFrom = m > fm || (m === fm && d >= fd);
  const beforeTo = m < tm || (m === tm && d <= td);
  return afterFrom || beforeTo;
}

export function getAutoCampaign(date = new Date()) {
  const list = CAMPAIGNS.filter((c) => isActive(c, date));
  if (!list.length) return null;
  list.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return list[0];
}
