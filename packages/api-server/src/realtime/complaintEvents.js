const { EventEmitter } = require('events');

const complaintEvents = new EventEmitter();
complaintEvents.setMaxListeners(0);

const emitComplaintEvent = (type, complaint) => {
  complaintEvents.emit('complaint', {
    type,
    complaint,
    emittedAt: new Date().toISOString(),
  });
};

module.exports = {
  complaintEvents,
  emitComplaintEvent,
};
