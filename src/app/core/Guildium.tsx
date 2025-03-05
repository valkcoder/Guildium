import { types as badgeTypes, injectBadge, uninjectBadge, createFlairFromBadge } from "./badges-flairs";
import { AddonApiExports } from "../addons/addonApi.types";
import { WebpackRequire } from "../types/webpack";
import SettingsHandler from "./handlers/settings";
import WebpackHandler from "../addons/webpack";
import { UserFlair } from "../guilded/models";
import ThemeHandler from "./handlers/themes";
import { FormSpecs } from "../guilded/form";
import AddonHandler from "./handlers/addon";
import AddonApi from "../addons/addonApi";

import guildiumMainCss from "../css/main.styl";
import guildiumCss from "../css/styles.styl";

/**
 * Guildium's full manager's class.
 */
export default class Guildium {
    themes: ThemeHandler;
    addons: AddonHandler;
    settingsHandler: SettingsHandler;
    webpack?: WebpackHandler;
    styling?: Element;
    /**
     * A class that contains all of Guildium's configurations and settings.
     */
    constructor() {
        this.settingsHandler = new SettingsHandler();
        // Creates Themes & Addons manager
        this.themes = new ThemeHandler(this, this.settingsHandler.settings.themes, this.settingsHandler, window.GuildiumConfig.themes);
        this.addons = new AddonHandler(this, this.settingsHandler.settings.addons, this.settingsHandler, window.GuildiumConfig.addons);
    }

    /**
     * Initiates Guildium
     * @param webpackRequire A function that gets Guilded modules.
     */
    async init(webpackRequire: WebpackRequire) {
        return new Promise<void[]>(
            async (resolve, reject) => {
                this.webpack = new WebpackHandler(webpackRequire);

                // For add-on and theme CSS
                this.styling = Object.assign(document.createElement("datagroup"), {
                    id: "GuildiumStyle-container"
                });
                this.styling.append(
                    Object.assign(document.createElement("style"), {
                        id: "GuildiumStyle-datagroup",
                        innerHTML: guildiumMainCss
                    }),
                    Object.assign(document.createElement("style"), {
                        id: "GuildiumStyle-guildium",
                        innerHTML: guildiumCss
                    })
                );
                document.body.appendChild(this.styling);

                // I don't even have any idea why they are being disabled
                try {
                    window.__SENTRY__.hub.getClient().close(0);
                    window.__SENTRY__.logger.disable();
                } catch(e) {
                    console.warn("Failed to disable sentries:", e);
                }

                this.addons.webpack = this.webpack;

                await Promise.all([
                    this.addons.init(),
                    this.themes.init()
                ])
                    .then(resolve)
                    .catch(reject);
            }
        )
            .catch(e => console.error("Guildium failed to initialize:", e))
            .then(async () =>
                // Tasks that aren't critical
                await Promise.all([
                    import("./settings/settings").then(async ({ default: SettingsInjector }) =>
                        await (window.settingsInjector = new SettingsInjector()).init()
                    ),

                    // Global badges
                    new Promise<void>(resolve => (this.loadUserBadges(), resolve())),

                    // Only do it if user has enabled auto-update
                    this.settingsHandler.settings.autoUpdate &&
                        window.GuildiumConfig.doUpdateIfPossible()
                            .then((isUpdated) => isUpdated && location.reload()),

                    window.GuildiumConfig.isFirstLaunch && this.handleFirstLaunch(),
                ]).then(() => console.log("Guildium done initializing"))
            );
    }


    // REVIEW: This should be called & ran when the user requests Guilded to fully exit.
    /**
     * Uninitiates Guildium
     */
    uninit(): void {
        this.themes.unloadAll();
        this.addons.unloadAll();
    }

    /**
     * Loads Guildium developer badges & contributor flairs.
     */
    loadUserBadges(): void {
        if (!this.settingsHandler.settings.badge) return;

        const { UserModel } = this.getApiProperty("guilded/users");

        if (!UserModel) return;

        // Either flair of badge depending on settings
        const [injectDevBadgeIntoFlairs, devBadge] =
            this.settingsHandler.settings.badge === 1 ? [true, definedFlairs.dev || createFlairFromBadge(badgeTypes.dev)] : [false, badgeTypes.dev];

        // Always flair
        const contribFlair = definedFlairs.contrib || createFlairFromBadge(badgeTypes.contrib);

        const flairTable: { [name: string]: UserFlair } = { contrib: contribFlair };

        if (injectDevBadgeIntoFlairs) flairTable.dev = devBadge as UserFlair;
        else injectBadge(UserModel.prototype, "badges", { dev: devBadge });

        injectBadge(UserModel.prototype, "flairInfos", flairTable);
    }
    /**
     * Unloads Guildium developer badges & contributor flairs.
     */
    unloadUserBadges(): void {
        const { UserModel } = this.getApiProperty("guilded/users");

        if (!UserModel) return;

        uninjectBadge(UserModel.prototype, "badges");
        uninjectBadge(UserModel.prototype, "flairInfos");
    }

    getApiProperty<T extends string>(name: T): AddonApiExports<T> {
        return AddonApi.getApiCachedProperty<T>(name, this.webpack);
    }

    async handleFirstLaunch() {
        const transientMenuPortal = window.Guildium.getApiProperty("transientMenuPortal"),
            RouteLink = window.Guildium.getApiProperty("guilded/components/RouteLink");

        const menuPortalContext = transientMenuPortal.__reactInternalMemoizedUnmaskedChildContext;

        const formSpecs: FormSpecs =
            {
                description: [
                    "Guildium has successfully installed! You can now open ",
                    // TODO: Link to settings "Themes"
                    "theme settings",
                    " or ",
                    // TODO: Link to settings "Addons"
                    "addon settings",
                    " to install any themes or addons you would like. If you would like to receive Guildium updates out of the box, be sure to check the checkbox below:"
                ],
                sections: [
                    {
                        fieldSpecs: [
                            {
                                type: "Checkboxes",
                                fieldName: "settings",

                                isOptional: true,

                                options: [
                                    {
                                        optionName: "autoUpdate",
                                        label: "Auto-Update Guildium",
                                        description: "Any time Guilded gets refreshed or launches, Guildium will check for its own updates and install them if they exist."
                                    }
                                ],
                                defaultValue: [
                                    {
                                        optionName: "autoUpdate",
                                        value: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

        const { values, isChanged } = await menuPortalContext.SimpleFormOverlay.Open(menuPortalContext, {
            header: "Successfully Installed",
            confirmText: "Continue",
            controlConfiguration: "Confirm",
            formSpecs
        });

        // Only apply settings if any of the settings were modified
        if (isChanged) {
            // Use mapping if more options appear
            const [ { optionName, value } ] = values.settings;
            this.settingsHandler.updateSettings({ [optionName]: value });
        }
    }
};
const definedFlairs: { dev?: UserFlair, contrib?: UserFlair } = {};