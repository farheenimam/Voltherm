import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import screenSiteRouter from './routes/screenSite.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'voltherm-backend', time: new Date().toISOString() });
});

app.use('/api/screen-site', screenSiteRouter);

// 404 + error handling must be registered last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`⚡ Voltherm API listening on http://localhost:${PORT}`);
});

export default app;
