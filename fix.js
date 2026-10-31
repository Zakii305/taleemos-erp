const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
let filtered = lines.filter(line => !line.includes('AuditLogsModule'));
fs.writeFileSync('src/App.tsx', filtered.join('\n'), 'utf8');
console.log('AuditLogsModule references removed completely!');
