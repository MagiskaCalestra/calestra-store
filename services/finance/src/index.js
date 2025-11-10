// --- ESM helpers + env (finance) ---
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import express from "express";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ladda .env.local (fallback .env)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config();

// Konfig
const PORT = Number(process.env.PORT || 14600);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5175";

// Stripe (kräver STRIPE_SECRET)
const stripeKey = process.env.STRIPE_SECRET || "";
if (!stripeKey) {
  console.warn("[finance] STRIPE_SECRET saknas – betalning kommer inte fungera.");
}
const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

// starta app (behåll din befintliga kod nedanför)
const app = express();
app.use(express.json());
