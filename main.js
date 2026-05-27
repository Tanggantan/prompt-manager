const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.join(__dirname, 'data', 'templates.json');

function readTemplates() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, '[]', 'utf-8');
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeTemplates(templates) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(templates, null, 2), 'utf-8');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#1a1a2e',
    show: false,
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());
}

ipcMain.handle('get-templates', () => readTemplates());

ipcMain.handle('save-template', (_event, template) => {
  const templates = readTemplates();
  const idx = templates.findIndex(t => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  writeTemplates(templates);
  return templates;
});

ipcMain.handle('delete-template', (_event, id) => {
  const templates = readTemplates().filter(t => t.id !== id);
  writeTemplates(templates);
  return templates;
});

ipcMain.handle('copy-to-clipboard', (_event, text) => {
  clipboard.writeText(text);
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
