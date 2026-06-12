import express from 'express';
import cors from 'cors';
import playerRoutes from './routes/player';
import sessionRoutes from './routes/sessions';
import statsRoutes from './routes/stats';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/player', playerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AimCoach server running on port ${PORT}`);
});

export default app;
