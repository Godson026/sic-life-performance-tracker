const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  target_type: {
    type: String,
    enum: ['sales', 'registration'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure either branch or coordinator is set, but not both
targetSchema.pre('save', function(next) {
  if (!this.branch && !this.coordinator) {
    return next(new Error('Either branch or coordinator must be specified'));
  }
  if (this.branch && this.coordinator) {
    return next(new Error('Cannot set both branch and coordinator targets'));
  }
  next();
});

const Target = mongoose.model('Target', targetSchema);

module.exports = Target;
