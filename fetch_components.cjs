const https = require('https');
const fs = require('fs');
const path = require('path');

const components = [
  'button', 'card', 'input', 'label', 'table', 'badge', 'separator', 
  'dropdown-menu', 'dialog', 'popover', 'select', 'command', 'tooltip', 'toast', 'sonner', 'form'
];

const outDir = path.join(__dirname, 'src', 'components', 'ui');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

components.forEach(comp => {
  https.get(`https://ui.shadcn.com/r/styles/new-york/${comp}.json`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.files && json.files.length > 0) {
          json.files.forEach(file => {
            const filePath = path.join(outDir, file.name);
            fs.writeFileSync(filePath, file.content);
            console.log(`Saved ${file.name}`);
          });
        }
      } catch (e) {
        console.error(`Error parsing ${comp}:`, e.message);
      }
    });
  }).on('error', err => console.error(`Failed to fetch ${comp}:`, err.message));
});
