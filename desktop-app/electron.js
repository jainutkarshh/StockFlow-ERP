const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const keytar = require('keytar');

let mainWindow;
let backendProcess;

const SERVICE_NAME = 'WaterDistributionSystem';
const ACCOUNT_NAME = 'user-auth-token';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // Load the React app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:4002');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Create custom menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Export Data',
                    click: () => {
                        mainWindow.webContents.send('export-data');
                    }
                },
                {
                    label: 'Print Report',
                    click: () => {
                        mainWindow.webContents.print();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Backup Database',
                    click: async () => {
                        const { filePath } = await dialog.showSaveDialog({
                            title: 'Backup Database',
                            defaultPath: `water-system-backup-${Date.now()}.db`,
                            filters: [
                                { name: 'Database Files', extensions: ['db'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });
                        
                        if (filePath) {
                            mainWindow.webContents.send('backup-database', filePath);
                        }
                    }
                },
                {
                    label: 'Low Stock Alert',
                    click: () => {
                        mainWindow.webContents.send('check-low-stock');
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: () => {
                        require('electron').shell.openExternal('https://example.com/docs');
                    }
                },
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'About',
                            message: 'Water Distribution System',
                            detail: 'Version 1.0.0\n\nStock Management System for Water & Cold Drink Distribution',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Start backend server
    startBackendServer();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackendServer() {
    const backendPath = path.join(__dirname, '..', 'backend');
    
    backendProcess = spawn('node', ['server.js'], {
        cwd: backendPath,
        stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers - Secure Token Storage using keytar
ipcMain.handle('set-token', async (event, token) => {
    try {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
        return { success: true };
    } catch (error) {
        console.error('Failed to store token:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-token', async (event) => {
    try {
        const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        return token || null;
    } catch (error) {
        console.error('Failed to retrieve token:', error);
        return null;
    }
});

ipcMain.handle('clear-token', async (event) => {
    try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        return { success: true };
    } catch (error) {
        console.error('Failed to clear token:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-backend-status', async () => {
    return { status: 'running', port: 5000 };
});

ipcMain.handle('show-alert', async (event, title, message) => {
    dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: title,
        message: message,
        buttons: ['OK']
    });
});
