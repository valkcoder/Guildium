export declare enum BadgeHandling {
    None,
    Flair = 1,
    Badge = 2
}
export type GuildiumSettings = {
    autoUpdate: boolean;
    badge: BadgeHandling;
    loadAuthors: boolean;
    loadImages: boolean;
    keepSplash: boolean;
    addons: GuildiumAddonSettings;
    themes: GuildiumEnhancementSettings;
};
export type GuildiumSettingsUpdate = {
    autoUpdate?: boolean;
    badge?: BadgeHandling;
    loadAuthors?: boolean;
    keepSplash?: boolean;
    addons?: GuildiumEnhancementSettings;
    themes?: GuildiumEnhancementSettings;
};
export type GuildiumWhitelist = {
    all: Array<string>;
    connect: Array<string>;
    default: Array<string>;
    font: Array<string>;
    img: Array<string>;
    media: Array<string>;
    script: Array<string>;
    style: Array<string>;
};
export interface GuildiumEnhancementSettings {
    enabled: string[];
}
export interface GuildiumAddonSettings extends GuildiumEnhancementSettings {
    permissions: { [addonId: string]: number };
}
