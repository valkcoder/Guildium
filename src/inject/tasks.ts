import guildiumInfo from "../common/guildium.json";
import uninjection from "./util/uninjection.js";
import injection from "./util/injection.js";
import { copy, writeFile } from "fs-extra";
import { exec } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import platform from "./util/platform";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Injects Guildium into Guilded.
 * @param platformModule Module correlating to User's Platform, used for directories and commands.
 * @param guildiumDir Path to Guildium's install directory
 * @param elevator Elevation command on Linux
 */
export function inject(
    platformModule: { appDir: string; resourcesDir: string, guildiumDir: string },
    elevator?: string
) {
    return new Promise<void>((resolve, reject) => {
        const src = join(__dirname, "./guildium.asar");

        copy(
            src,
            join(platform.guildiumDir, "guildium.asar"),
            { recursive: true, errorOnExist: false, overwrite: true },
            err => {
                if (err) reject(err);

                injection(platformModule).then(() => {
                    ["linux", "darwin"].includes(process.platform) && exec(`chmod -R 777 ${platform.guildiumDir}`);
                    process.platform === "win32" && exec(`icacls ${platform.guildiumDir} /grant "Authenticated Users":(OI)(CI)F`);
                }).then(resolve).catch((err) => {
                    // If there was an error, try uninjecting Guildium
                    console.log("There was an error, reverting process more details will follow shortly...");

                    uninject(platformModule, elevator).catch(reject);

                    reject(err);
                })
            }
        );
    });
}

/**
 * Removes any injections present in Guilded.
 * @param platformModule Module correlating to User's Platform, used for directories and commands.
 * @param guildiumDir Path to Guildium's install directory
 * @param elevator Elevation command on Linux
 */
export async function uninject(
    platformModule: { appDir: string; resourcesDir: string },
    elevator?: string
) {
    return new Promise<void>((resolve, reject) => {
        // If there is an injection, then remove the injection
        uninjection(platformModule).then(resolve).catch(reject);
    });
}

/**
 * Writes 'package.json' & Packs Asar
 */
export async function prepareAndPackResources() {
    return new Promise<void>((resolve, reject) => {
        writeFile(
            join(__dirname, "app", "package.json"),
            `{"name":"guildium","main":"electron.patcher.js", "version":"${guildiumInfo.version}"}`,
            "utf8"
        ).then(() => exec("asar pack ./out/app ./out/guildium.asar", (err) => {
            if (err) reject(err);
            resolve();
        }));
    });

}
