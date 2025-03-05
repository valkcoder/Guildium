import { GuildiumSettings, GuildiumSettingsUpdate } from "../../../common/guildium-settings";
import { AbstractEventTarget } from "./eventTarget";

/**
 * The wrapping handler around `window.GuildiumConfig` for easier changes tracking.
 */
export default class SettingsHandler {
    settings: GuildiumSettings;
    constructor() {
        this.settings = window.GuildiumConfig.settings.getSettings();
        // Support older versions of settings
        if (!this.settings.addons.permissions) this.settings.addons.permissions = {};
    }
    /**
     * Updates the settings and saves them in settings file.
     * @param settingsProps The properties to set
     */
    async updateSettings(settingsProps: GuildiumSettingsUpdate): Promise<void> {
        this.settings = Object.assign(this.settings, settingsProps);
        await window.GuildiumConfig.settings.updateSettings(settingsProps);
    }
    /**
     * Saves the current settings.
     */
    async save(): Promise<void> {
        await window.GuildiumConfig.settings.updateSettings(this.settings);
    }
}
