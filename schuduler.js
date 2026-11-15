import cron from 'node-cron';

import { cleanupStaleRecords } from '../jobs/cleanup.job.js';
import { sendEmailSummary } from '../jobs/email-summary.job.js';
import { executeJob } from '../services/job-executor.js';

const jobs = [
  {
    name: 'cleanup-stale-records',
    description: 'Delete stale database records',
    schedule: process.env.CLEANUP_CRON || '0 2 * * *',
    task: cleanupStaleRecords
  },
  {
    name: 'email-summary',
    description: 'Send daily email summary',
    schedule: process.env.EMAIL_SUMMARY_CRON || '0 8 * * *',
    task: sendEmailSummary
  }
];

const tasks = new Map();

export function getJobs() {
  return jobs;
}

export function startScheduler() {
  for (const job of jobs) {
    if (!cron.validate(job.schedule)) {
      console.error(`Invalid cron expression: ${job.name}`);
      continue;
    }

    const task = cron.schedule(
      job.schedule,
      () => {
        executeJob(job, 'scheduled').catch(console.error);
      },
      {
        timezone: process.env.SCHEDULER_TIMEZONE || 'Africa/Johannesburg'
      }
    );

    tasks.set(job.name, task);

    console.log(
      `[SCHEDULER] ${job.name}: ${job.schedule}`
    );
  }
}

export function stopScheduler() {
  for (const task of tasks.values()) {
    task.stop();
  }

  tasks.clear();
}

export function getRunningJobs() {
  return [...tasks.keys()];
}