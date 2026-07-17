const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: "موکب الشهدا قم",
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("print-label", async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow) return { ok: false, error: "پنجره چاپ پیدا نشد." };

  return new Promise((resolve) => {
    senderWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
        landscape: false,
        pageSize: {
          width: 100000,
          height: 50000
        },
        margins: {
          marginType: "custom",
          top: 10000,
          bottom: 0,
          left: 0,
          right: 0
        }
      },
      (success, failureReason) => {
        resolve({
          ok: success,
          error: success ? null : failureReason
        });
      }
    );
  });
});
