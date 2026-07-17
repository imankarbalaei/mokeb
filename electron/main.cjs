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
      sandbox: false
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
    try {
      senderWindow.webContents.print(
        {
          silent: false,
          printBackground: true
        },
        (success, failureReason) => {
          resolve({
            ok: success,
            error: success ? null : failureReason || "چاپ انجام نشد."
          });
        }
      );
    } catch (error) {
      resolve({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
});
