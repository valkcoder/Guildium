import { GuildiumSettings, GuildiumWhitelist } from "../common/guildium-settings";
import { defaultSettings, defaultWhitelist } from "./settings";
import { readFileSync, promises as fsPromises } from "fs";
import { join } from "path";

/**
 * Gets the Guildium settings file. If it's not present, it gets created and default settings get returned instead.
 * @param settingsPath The path to settings
 * @returns Settings
 */
export default function getSettingsFile(settingsPath: string) {
    return new Promise<[GuildiumSettings, GuildiumWhitelist]>((resolve, reject) => {
        fsPromises
            .access(settingsPath)
            // Settings were found, just read the file
            .then(() => {
                window.isFirstLaunch = false;
                resolve([JSON.parse(readFileSync(join(settingsPath, "settings.json"), { encoding: "utf8" })), JSON.parse(readFileSync(join(settingsPath, "custom-csp-whitelist.json"), { encoding: "utf8" }))]);
            })
            // Settings doesn't exist, create them and give default settings
            .catch(e => {
                // Reject if file exists, but it's other error
                if (!e || !e.code || e.code !== "ENOENT") return reject(e);

                // There are no settings, so it's the first time
                window.isFirstLaunch = true;

                // Create ~/.guildium/settings
                fsPromises.mkdir(settingsPath, { recursive: true }).then(async () => {
                    const settingsJson = JSON.stringify(defaultSettings, null, 4);
                    const customWhitelistJson = JSON.stringify(defaultWhitelist, null, 4);

                    await Promise.all([
                        fsPromises.writeFile(join(settingsPath, "settings.json"), settingsJson, { encoding: "utf-8" }),
                        fsPromises.writeFile(join(settingsPath, "custom-csp-whitelist.json"), customWhitelistJson, { encoding: "utf-8" }),
                        fsPromises.mkdir(join(settingsPath, "themes")),
                        fsPromises.mkdir(join(settingsPath, "addons")),
                    ]).then(() => resolve([defaultSettings, defaultWhitelist]));
                });
            });
    });
}
