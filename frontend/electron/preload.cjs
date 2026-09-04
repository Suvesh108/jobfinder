const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'win32',
  isDesktop: true,
  version: '2.1.4',
});
