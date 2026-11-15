import { Router } from 'express';

import JobExecution from '../models/JobExecution.js';

import {
  executeJob,
  isJobRunning
} from '../services/job-executor.js';

import {
  getJobs
} from '../scheduler/scheduler.js';

const router = Router();

// List scheduled jobs
router.get('/', (req, res) => {
  res.json(
    getJobs().map(job => ({
      name: job.name,
      description: job.description,
      schedule: job.schedule,
      running: isJobRunning(job.name)
    }))
  );
});

// Execution history
router.get('/history', async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 100, 1),
      500
    );

    const history = await JobExecution.find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Manually execute a job
router.post('/:jobName/run', (req, res) => {
  const job = getJobs().find(
    item => item.name === req.params.jobName
  );

  if (!job) {
    return res.status(404).json({
      message: 'Job not found'
    });
  }

  if (isJobRunning(job.name)) {
    return res.status(409).json({
      message: 'Job already running'
    });
  }

  executeJob(job, 'manual').catch(error => {
    console.error('Manual execution failed:', error);
  });

  return res.status(202).json({
    message: 'Job started',
    job: job.name
  });
});

export default router;