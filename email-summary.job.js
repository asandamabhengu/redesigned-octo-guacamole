import nodemailer from 'nodemailer';
import JobExecution from '../models/JobExecution.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendEmailSummary() {
  const since = new Date(Date.now() - 86400000);

  const executions = await JobExecution.find({
    startedAt: { $gte: since },
    status: { $in: ['success', 'failure'] }
  }).sort({ startedAt: -1 }).lean();

  const successful = executions.filter(
    job => job.status === 'success'
  ).length;

  const failed = executions.filter(
    job => job.status === 'failure'
  ).length;

  const body = `
Daily Scheduled Jobs Summary

Total: ${executions.length}
Successful: ${successful}
Failed: ${failed}

${executions.map(job => `
Job: ${job.jobName}
Status: ${job.status}
Duration: ${job.duration ?? 0}ms
Error: ${job.error || 'None'}
`).join('\n')}

Generated: ${new Date().toISOString()}
`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SUMMARY_EMAIL,
    subject: 'Daily Job Execution Summary',
    text: body
  });

  return {
    message: 'Summary email sent',
    total: executions.length,
    successful,
    failed
  };
}