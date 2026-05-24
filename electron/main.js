const { app, BrowserWindow, shell, protocol, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const logPath = path.join(app.getPath('userData'), 'debug.log');
const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`);
const isDev = process.env.NODE_ENV === 'development';
const { ipcMain } = require('electron');

const OFFLINE_DIR = path.join(app.getPath('userData'), 'offline_videos');
const ENCRYPTION_KEY = crypto.scryptSync('dcs-offline-key', 'salt-dcs-2024', 32); // fixed app secret

if (!fs.existsSync(OFFLINE_DIR)) fs.mkdirSync(OFFLINE_DIR, { recursive: true });

const getEncryptedFilePath = (videoId) => path.join(OFFLINE_DIR, `${videoId}.enc`);
const getMetaFilePath = () => path.join(OFFLINE_DIR, 'meta.json');

const readMeta = () => {
  try {
    return JSON.parse(fs.readFileSync(getMetaFilePath(), 'utf8'));
  } catch { return {}; }
};

const writeMeta = (meta) => fs.writeFileSync(getMetaFilePath(), JSON.stringify(meta));

let mainWindow;
let backendProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets/DCS_Skills_logo.png'),
    title: 'Data Centre Skills',
    show: true, // don't show until ready
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
  } else {
    const indexPath = path.join(process.resourcesPath, 'frontend/dist/index.html');
    const fileUrl = `file:///${indexPath.replace(/\\/g, '/')}`;
    log('Loading URL: ' + fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => log('Load error: ' + err));

    // Add this to catch renderer crashes:
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      log('Renderer crash: ' + JSON.stringify(details));
    });

    mainWindow.webContents.on('did-fail-load', (event, code, desc) => {
      log('Failed to load: ' + code + ' ' + desc);
    });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log(`CONSOLE [${level}]: ${message} (${sourceId}:${line})`);
    });
  }

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  // Open external links in browser, not in app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
      return { action: 'deny' }; // prevent Electron from opening it
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

app.whenReady().then(() => {
  createWindow();

  // Check for updates in production
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Register custom streaming protocol
  protocol.registerBufferProtocol('dcs-video', (request, callback) => {
    const videoId = decodeURIComponent(request.url.replace('dcs-video://', ''));
    const filePath = getEncryptedFilePath(videoId);

    if (!fs.existsSync(filePath)) {
      callback({ error: -6 }); // FILE_NOT_FOUND
      return;
    }

    try {
      const encrypted = fs.readFileSync(filePath);
      const iv = encrypted.slice(0, 16);
      const data = encrypted.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

      callback({
        mimeType: 'video/mp4',
        data: decrypted,
      });
    } catch (err) {
      log('offline:stream error: ' + err.message);
      callback({ error: -2 });
    }
  });
});

app.on('window-all-closed', () => {
  // Kill backend process if running
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

ipcMain.on('set-content-protection', (event, enabled) => {
  mainWindow.setContentProtection(enabled);
});

// Download and encrypt
ipcMain.handle('offline:download', async (event, { videoId, videoUrl, title }) => {
  return new Promise((resolve, reject) => {
    const filePath = getEncryptedFilePath(videoId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const writeStream = fs.createWriteStream(filePath);

    writeStream.write(iv); // prepend IV to file

    const requestLib = videoUrl.startsWith('https') ? https : http;
    requestLib.get(videoUrl, (response) => {
      const total = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = total ? Math.round((downloaded / total) * 100) : 0;
        event.sender.send('offline:progress', { videoId, progress });
      });

      response.pipe(cipher).pipe(writeStream);

      writeStream.on('finish', () => {
        const meta = readMeta();
        meta[videoId] = { title, downloadedAt: new Date().toISOString(), filePath };
        writeMeta(meta);
        resolve({ success: true });
      });

      writeStream.on('error', reject);
    }).on('error', reject);
  });
});

// Check if video is downloaded
ipcMain.handle('offline:status', async (event, { videoId }) => {
  const meta = readMeta();
  const exists = fs.existsSync(getEncryptedFilePath(videoId));
  return { downloaded: !!meta[videoId] && exists };
});

// Get all downloaded videos
ipcMain.handle('offline:list', async () => {
  const meta = readMeta();
  return Object.entries(meta).map(([videoId, data]) => ({ videoId, ...data }));
});

// Delete downloaded video
ipcMain.handle('offline:delete', async (event, { videoId }) => {
  const filePath = getEncryptedFilePath(videoId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const meta = readMeta();
  delete meta[videoId];
  writeMeta(meta);
  return { success: true };
});

/* Serve decrypted video as base64 for playback
ipcMain.handle('offline:serve', async (event, { videoId }) => {
  const filePath = getEncryptedFilePath(videoId);
  if (!fs.existsSync(filePath)) throw new Error('Video not found offline');

  const encrypted = fs.readFileSync(filePath);
  const iv = encrypted.slice(0, 16);
  const data = encrypted.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('base64');
}); */

// Optional: Start backend server with Electron (uncomment if bundling backend)
/*
function startBackendServer() {
  const { spawn } = require('child_process');
  const backendPath = path.join(process.resourcesPath, 'backend');
  
  log('Starting backend server from: ' + backendPath);
  
  backendProcess = spawn('node', ['src/server.js'], {
    cwd: backendPath,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  backendProcess.stdout.on('data', (data) => {
    log('Backend: ' + data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    log('Backend Error: ' + data.toString());
  });

  backendProcess.on('close', (code) => {
    log('Backend process exited with code ' + code);
  });
}
*/