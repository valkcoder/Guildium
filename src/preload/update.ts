import guildiumInfo from "../common/guildium.json";
import { createWriteStream } from "fs-extra";
import got from "got";
import { join } from "path";


export default async function handleUpdate(updateInfo: VersionJson) {
    process.noAsar = true;

    const downloadUrl = updateInfo.assets.find(x => x.name === "guildium.asar").browser_download_url;
    const downloadPath = join(__dirname);

    return new Promise<boolean>(resolve => {
        try {
            got.stream(downloadUrl)
                .pipe(createWriteStream(downloadPath))
                .on("finish", () => {
                    console.debug("Download Finished");

                    process.noAsar = false;
                    resolve(true);
                });
        } catch (err) {
            console.error("There was an error updating: ", err);
            resolve(false);
        }
    });
}

export type VersionJson = {
    noRelease?: boolean;

    version?: string;
    assets?: Array<{
        browser_download_url: string;
        name: string;
    }>;
};

/**
 * Checks if there's an update.
 * @param forceUpdate Whether to force the update or not.
 */
export async function checkForUpdate(forceUpdate: boolean = false): Promise<[boolean, VersionJson]> {
    return new Promise<VersionJson>(resolve => {
        fetch("https://api.github.com/repos/valkcoder/Guildium/releases/latest").then(response => {
            if (!response.ok) {
                resolve({
                    noRelease: true
                });
            } else {
                response.json().then(json => {
                    resolve({
                        version: json.tag_name,
                        assets: json.assets
                    });
                });
            }
        });
    }).then(json => [
        (window.updateExists =
            !json.noRelease && json.assets.length !== 0 && (forceUpdate || json.version !== guildiumInfo.version)),
        (window.latestVersionInfo = json)
    ]);
}
