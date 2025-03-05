import { VersionJson } from "./update";

export {};

declare global {
    interface Window {
        /**
         * Whether Guildium has been launched for the first time.
         */
        isFirstLaunch: boolean;
        /**
         * The info about the latest update.
         */
        latestVersionInfo?: VersionJson;
        /**
         * Whether there is updated version of Guildium.
         */
        updateExists?: boolean;
    }
}
