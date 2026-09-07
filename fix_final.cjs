const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let inCanvas = false;
let newLines = [];
for(let line of lines) {
  if(line.includes('<ElectricalCanvas')) inCanvas = true;
  if(line.includes('/>') && inCanvas) inCanvas = false;
  
  if (inCanvas) {
    if (line.includes('isDesignerOpen={isDesignerOpen}') || line.includes('onToggleDesigner=')) {
      continue; // skip
    }
  }
  newLines.push(line);
}

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
