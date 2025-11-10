// apps/web/src/api/dining.js
// Minimock – byt mot riktiga endpoints senare.

export const DINING = [
  {
    id: "jaleo",
    name: "Jaleo by José Andrés",
    type: ["Table Service","Signature"],
    area: "Disney Springs",
    price: "$$$",
    plans: ["Dining Plan"],
    coords: [28.3692, -81.5178],
    images: ["/public/images/ui/jaleo.jpg"],
  },
  {
    id: "tiffins",
    name: "Tiffins Restaurant",
    type: ["Table Service","African"],
    area: "Animal Kingdom",
    price: "$$$",
    plans: ["Dining Plan"],
    coords: [28.358, -81.591],
    images: ["/public/images/ui/tiffins.jpg"],
  },
  {
    id: "starlight",
    name: "Starlight Snacks",
    type: ["Quick Service"],
    area: "Magic Kingdom",
    price: "$$",
    plans: ["Quick-Service Plan"],
    coords: [28.418, -81.582],
    images: [],
  },
];

export function filterRestaurants(q) {
  return DINING.filter(r => {
    if (q.acceptsReservations && !r.type.includes("Table Service")) return false;
    if (q.types.size && ![...q.types].some(t => r.type.includes(t))) return false;
    if (q.areas.size && !q.areas.has(r.area)) return false;
    if (q.price.size && !q.price.has(r.price)) return false;
    if (q.plan.size && ![...q.plan].some(p => r.plans.includes(p))) return false;
    return true;
  });
}

// Förenklad “availability”: generera fasta slotar per dag och ta bort några slumpmässigt.
export function getAvailability(restaurantId, range, party) {
  if (!range.start || !range.end) return [];
  const DAY = 24*60*60*1000;
  const dates = [];
  for (let t = startOfDay(range.start).getTime(); t <= startOfDay(range.end).getTime(); t += DAY) {
    dates.push(new Date(t));
  }
  const baseSlots = ["11:30","12:00","12:30","13:00","17:00","17:30","18:00","18:30","19:00"];
  return dates.map(d => {
    const seed = hashCode(restaurantId + d.toDateString() + (party?.adults||0));
    const slots = baseSlots.filter((_, i) => (seed+i)%3 !== 0); // ta bort 1/3 för variation
    return { date: d, slots };
  });
}

function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function hashCode(s){ let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return Math.abs(h); }
