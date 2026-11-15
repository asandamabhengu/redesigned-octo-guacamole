import JobExecution from '../models/JobExecution.js';

const runningJobs = new Set();

export function isJobRunning(name) {
  return runningJobs.has(name);
}

export async function executeJob(job, trigger = 'scheduled') {
  if (runningJobs.has(job.name)) {
    return {
      accepted: false,
      status: 'already-running'
    };
  }

  runningJobs.add(job.name);

  const startedAt = new Date();
  const startTime = Date.now();

  let execution;

  try {
    execution = await JobExecution.create({
      jobName: job.name,
      trigger,
      status: 'running',
      startedAt
    });

    const result = await job.task();

    await JobExecution.updateOne(
      { _id: execution._id },
      {
        $set: {
          status: 'success',
          result,
          completedAt: new Date(),
          duration: Date.now() - startTime
        }
      }
    );

    console.log(`[SUCCESS] ${job.name}`);

    return {
      accepted: true,
      status: 'success',
      executionId: execution._id,
      result
    };

  } catch (error) {
    console.error(`[FAILURE] ${job.name}`, error);

    if (execution) {
      try {
        await JobExecution.updateOne(
          { _id: execution._id },
          {
            $set: {
              status: 'failure',
              error: error.message,
              completedAt: new Date(),
              duration: Date.now() - startTime
            }
          }
        );
      } catch (loggingError) {
        console.error('Failed to save execution log:', loggingError);
      }
    }

    return {
      accepted: true,
      status: 'failure',
      error: error.message
    };

  } finally {
    runningJobs.delete(job.name);
  }
}