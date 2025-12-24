const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Auth - Secure token storage via keytar
    setToken: (token) => ipcRenderer.invoke('set-token', token),
    getToken: () => ipcRenderer.invoke('get-token'),
    clearToken: () => ipcRenderer.invoke('clear-token'),
    
    // Menu actions
    onExportData: (callback) => ipcRenderer.on('export-data', callback),
    onBackupDatabase: (callback) => ipcRenderer.on('backup-database', callback),
    onCheckLowStock: (callback) => ipcRenderer.on('check-low-stock', callback),
    
    // Dialog
    showAlert: (title, message) => ipcRenderer.invoke('show-alert', title, message),
    
    // Backend
    getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
    
    // Print
    print: () => ipcRenderer.send('print')
});
