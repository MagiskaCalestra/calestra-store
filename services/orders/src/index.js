import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// API-routes
app.use('/', router);

const PORT = Number(process.env.PORT) || 14580;

// Guard mot dubbel-bind vid hot-reload
if (!globalThis.__ORDERS_LISTENING__) {
  app.listen(PORT, () => {
    console.log(`[orders] listening on http://localhost:${PORT}`);
  });
  globalThis.__ORDERS_LISTENING__ = true;
}
