const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sales_amount: {
    type: Number,
    required: true,
    default: 0
  },
  new_registrations: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const SalesRecord = mongoose.model('SalesRecord', salesRecordSchema);

module.exports = SalesRecord;
