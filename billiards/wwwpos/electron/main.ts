import { app, BrowserWindow, shell, Menu } from 'electron';
import { join } from 'path';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { config } from 'dotenv';

config({ path: join(app.getAppPath(), '.env.production') });

const isDev = process.env.COZE_PROJECT_ENV !== 'PROD';
const DEV_URL = 'http://localhost:5000';

let mainWindow: BrowserWindow | null = null;
let serverPort = parseInt(process.env.PORT || '5000', 10);

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '台球收银系统',
      submenu: [
        { label: '退出', accelerator: 'Alt+F4', role: 'quit' },
      ],
    },
    {
      label: '调试',
      submenu: [
        {
          label: '打开开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          },
        },
        {
          label: '强制刷新',
          accelerator: 'Ctrl+Shift+R',
          click: () => {
            mainWindow?.webContents.reloadIgnoringCache();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const hostname = '127.0.0.1';

    if (isDev) {
      console.log('[startServer] DEV mode, using port 5000');
      resolve(5000);
      return;
    }

    console.log(`[startServer] PROD mode, appPath: ${app.getAppPath()}`);
    console.log(`[startServer] initial serverPort: ${serverPort}`);
    console.log(`[startServer] env PORT: ${process.env.PORT}`);
    console.log(`[startServer] env NEXT_PUBLIC_API_BASE_URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}`);

    const nextApp = next({
      dev: false,
      hostname,
      port: serverPort,
      dir: join(app.getAppPath()),
    });

    const handle = nextApp.getRequestHandler();

    nextApp.prepare().then(() => {
      console.log('[startServer] Next.js prepared successfully');

      const server = createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url!, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('[startServer] request error:', req.url, err);
          res.statusCode = 500;
          res.end('Internal server error');
        }
      });

      server.once('error', (err: any) => {
        console.error('[startServer] server error:', err);
        if (err.code === 'EADDRINUSE') {
          serverPort++;
          console.log(`[startServer] EADDRINUSE, retrying port ${serverPort}`);
          server.listen(serverPort, hostname);
        } else {
          reject(err);
        }
      });

      server.listen(serverPort, hostname, () => {
        const actualPort = (server.address() as any).port;
        console.log(`[startServer] listening on http://${hostname}:${actualPort}`);
        resolve(actualPort);
      });
    }).catch((err) => {
      console.error('[startServer] Next.js prepare failed:', err);
      reject(err);
    });
  });
}

function createWindow(port: number) {
  console.log(`[createWindow] port = ${port}`);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: '台球收银系统',
    icon: join(app.getAppPath(), 'public', 'favicon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    frame: false,
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setFullScreen(true);

  const loadUrl = isDev ? DEV_URL : `http://127.0.0.1:${port}`;
  console.log(`[createWindow] loading URL: ${loadUrl}`);

  mainWindow.loadURL(loadUrl);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[createWindow] page did-finish-load');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[createWindow] did-fail-load: code=${errorCode} desc=${errorDescription} url=${validatedURL}`);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('[createWindow] dom-ready');
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[renderer] ${message}`);
  });

  mainWindow.once('ready-to-show', () => {
    console.log('[createWindow] ready-to-show');
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    buildMenu();
    console.log('[main] app.whenReady, starting server...');
    const port = await startServer();
    console.log(`[main] server started on port ${port}, creating window...`);
    createWindow(port);
  } catch (err) {
    console.error('[main] fatal error:', err);
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(serverPort);
  }
});
