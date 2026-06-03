const fs = require('fs');
const file = 'src/screens/shared/ComplaintDetail.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  /\{\(userInfo\?\.role === 'public' \|\| userInfo\?\.role === 'citizen' \|\| userInfo\?\.role === 'admin' \|\| userInfo\?\.role === 'superadmin' \|\| userInfo\?\.role === 'agent'\) &&\r?\n\s*complaint\.assignedWorker &&/,
  '{complaint.assignedWorker &&'
);

fs.writeFileSync(file, c);
console.log('Done');
