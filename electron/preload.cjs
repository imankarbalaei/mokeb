const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mokebPrint", {
  printLabel: () => ipcRenderer.invoke("print-label")
});
