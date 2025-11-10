import { CCORE } from "./config";
import * as Booking from "./modules/booking";
import * as Table from "./modules/table";
import * as Wish from "./modules/wish";
import * as Rules from "./modules/rules";
import * as Payments from "./modules/payments";
import * as Journal from "./modules/journal";
import * as Places from "./modules/places";
import * as DreamCircle from "./modules/dreamcircle";
import * as Sound from "../sound"; // ⬅️ NY
import { emit, on } from "./eventBus";

export const CCoreSDK = {
  config: CCORE,
  events: { emit, on },
  Booking,
  Table,
  Wish,
  Rules,
  Payments,
  Journal,
  Places,
  DreamCircle,
  Sound, // ⬅️ NY
};
