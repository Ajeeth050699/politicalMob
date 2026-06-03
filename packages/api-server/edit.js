const fs = require('fs');
const file = 'src/controllers/complaintController.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/const out = fmt\(updated\);/,
  `// Notify admins
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
    for (const admin of admins) {
      await notify(admin._id, '? Complaint "' + updated.category + '" was accepted by Worker ' + req.user.name, 'complaint', updated._id);
    }
  } catch(e) {}
  const out = fmt(updated);`
);

c = c.replace(/if \(complaint\.status === 'NEW'\) complaint\.status = 'ACCEPTED';/,
  `if (complaint.status === 'NEW') complaint.status = 'ACCEPTED';
    const isNewAssignment = String(complaint.assignedWorker) !== String(req.body.assignedWorker);
    if (isNewAssignment) {
      await notify(req.body.assignedWorker, 'You have been assigned to a new complaint: "' + complaint.category + '"', 'complaint', complaint._id);
    }`
);

c = c.replace(/if \(msgs\[complaint\.status\]\) \{\r?\n\s*await notify\(citizenId, msgs\[complaint\.status\], 'complaint', complaint\._id, workerId\);\r?\n\s*\}\r?\n\s*\}/,
  `if (msgs[complaint.status]) {
      await notify(citizenId, msgs[complaint.status], 'complaint', complaint._id, workerId);
    }
    if (complaint.status === 'COMPLETED') {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
      for (const admin of admins) {
         await notify(admin._id, '? Complaint "' + complaint.category + '" has been resolved.', 'complaint', complaint._id);
      }
    }
  }`
);

c = c.replace(/await notify\(citizenId, .*?, 'complaint'\);/,
  `$&
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
  for (const admin of admins) {
     await notify(admin._id, '? Complaint "' + complaint.category + '" has been resolved. Proof uploaded.', 'complaint', complaint._id);
  }`
);

fs.writeFileSync(file, c);
console.log('Done');
