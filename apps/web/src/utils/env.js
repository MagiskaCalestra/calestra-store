export const isDev = import.meta.env.DEV;
export const STORE_URL =
  isDev ? "http://localhost:5175/" : "/store"; // byt i prod till din riktiga URL eller subdomän
