import { getDB } from "./sqlite.js";
(async () => {
  await getDB();
  console.log("DB ready.");
})();
