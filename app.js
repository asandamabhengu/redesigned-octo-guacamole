import express from 'express';
import jobsRouter from './routes/jobs.routes.js';

const app = express();

app.use(express.json());

app.use('/api/jobs', jobsRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: 'Internal server error'
  });
});

export default app;