import mongoose from 'mongoose';

const jobExecutionSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    index: true
  },
  trigger: {
    type: String,
    enum: ['scheduled', 'manual'],
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'success', 'failure'],
    required: true,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number,
  result: mongoose.Schema.Types.Mixed,
  error: String
}, {
  timestamps: true
});

export default mongoose.model('JobExecution', jobExecutionSchema);