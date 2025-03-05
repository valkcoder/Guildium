import getSettingsFile from "../../preload/get-settings";
import { existsSync, readFileSync } from "fs";
import * as electron from "electron";
import { join } from "path";

// TODO: Add in check for a launch argument and then if it exists, then hang the close.

const preload = electron.ipcRenderer.sendSync("guildium-preload");

new Promise<boolean>((resolve) => {
    const settingsPath = join(process.env.APPDATA || process.env.HOME, ".guildium");

    if (!existsSync(settingsPath))
        resolve(false);
    else {
        getSettingsFile(settingsPath).then(([settings]) => resolve(settings.keepSplash));
    }
}).then((keepSplash) => {
    if (keepSplash) electron.ipcRenderer.invoke("guildium-no-splash-close");
}).then(() => preload && require(preload)).then(() => {
    electron.webFrame.executeJavaScript(readFileSync(join(__dirname, "electron.splash.js"), { encoding: "utf-8" }));
});