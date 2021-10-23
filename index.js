const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, dialog } = electron
const { autoUpdater } = require('electron-updater')
const iconPath = path.join(__dirname, './src/img/1024x1024.png')

let mainWindow
let tray
let remindWindow

app.on('ready', () => {
    //检查更新
    //checkUpdate()


    mainWindow = new BrowserWindow({
        frame: false,
        resizable: false,
        width: 800,
        height: 600,
        icon: iconPath,
        webPreferences: {
            backgroundThrottling: false,
            nodeIntegration: true,
            contextIsolation: false

        }
    })
    mainWindow.loadURL(`file://${__dirname}/src/index.html`)
    mainWindow.removeMenu()
    tray = new Tray(iconPath)
    tray.setToolTip('memorandum')
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })
    tray.on('right-click', () => {
        const menuConfig = Menu.buildFromTemplate([{
            label: '退出',
            click: () => app.quit()
        }])
        tray.popUpContextMenu(menuConfig)
    })

})

ipcMain.on('mainWindow:close', () => {
    mainWindow.hide()
})

ipcMain.on('remindWindow:close', () => {
    remindWindow.close()
})

ipcMain.on('setTaskTimer', (event, time, task) => {
    const now = new Date()
    const date = new Date()
    date.setHours(time.slice(0, 2), time.slice(3), 0)
    const timeout = date.getTime() - now.getTime()
    setTimeout(() => {
        createRemindWindow(task)
    }, timeout)
})

function createRemindWindow(task) {
    if (remindWindow) remindWindow.close()
    remindWindow = new BrowserWindow({
        height: 450,
        width: 360,
        resizable: false,
        frame: false,
        icon: iconPath,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    remindWindow.removeMenu()
    const size = screen.getPrimaryDisplay().workAreaSize
    const { y } = tray.getBounds()
    const { height, width } = remindWindow.getBounds()
    const yPosition = process.platform === 'darwin' ? y : y - height
    remindWindow.setBounds({
        x: size.width - width,
        y: yPosition,
        height,
        width
    })
    remindWindow.setAlwaysOnTop(true)
    remindWindow.loadURL(`file://${__dirname}/src/remind.html`)
    remindWindow.show()
    remindWindow.webContents.send('setTask', task)
    remindWindow.on('closed', () => { remindWindow = null })
    setTimeout(() => {
        remindWindow && remindWindow.close()
    }, 50 * 1000)
}

function checkUpdate() {
    //检测更新
    autoUpdater.checkForUpdates()

    //监听'error'事件
    autoUpdater.on('error', (err) => {
        console.log(err)
    })

    //监听'update-available'事件，发现有新版本时触发
    autoUpdater.on('update-available', () => {
        console.log('found new version')
    })

    //默认会自动下载新版本，如果不想自动下载，设置autoUpdater.autoDownload = false

    //监听'update-downloaded'事件，新版本下载完成时触发
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: '应用更新',
            message: '发现新版本，是否更新？',
            buttons: ['是', '否']
        }).then((buttonIndex) => {
            if (buttonIndex.response == 0) { //选择是，则退出程序，安装新版本
                autoUpdater.quitAndInstall()
                app.quit()
            }
        })
    })
}

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})