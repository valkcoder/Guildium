import { FieldAnySpecs } from "../../../../guilded/form";
import { Theme } from "../../../../../common/enhancements";
import EnhancementItem from "./EnhancementItem";
import validations from "../../validation";

export default class ThemeItem extends EnhancementItem<Theme, { settings: object, settingsProps: string[] }> {
    constructor(props, context) {
        super(props, context);

        const { id, settings, settingsProps, dirname } = props;

        this.state = {
            dirname,
            settings,
            settingsProps,
            enabled: window.Guildium.themes.enabled.includes(id)
        };

        const { switchTab } = this.props;

        // Add "Settings" button if settings are present
        if (settings)
            this.overflowMenuSpecs.sections.push({
                name: "Theme",
                type: "rows",
                actions: [
                    {
                        label: "Settings",
                        icon: "icon-settings",
                        onClick: () => switchTab("specific", { enhancement: this.props, defaultTabIndex: 1 })
                    }
                ]
            });
    }
    get formSpecs() {
        const { settings, settingsProps } = this.state;

        return {
            sections: [
                {
                    fieldSpecs: ThemeItem.generateSettingsFields(settings, settingsProps)
                }
            ]
        }
    }
    protected override async onToggle(enabled: boolean): Promise<void> {
        await window.Guildium.themes[enabled ? "savedLoad" : "savedUnload"](this.props)
            .then(() => this.setState({ enabled }));
    }
    static generateSettingsFields(settings: object, settingsProps: string[]): FieldAnySpecs[] {
        return settingsProps.map(id => {
            const { type, value, name } = settings[id];

            return {
                type: "Text",
                fieldName: id,
                header: name,
                label: type ? `Value (${type})` : "Value",
                defaultValue: value,

                inputType: type === "number" ? type : undefined,
                validationFunction: validations[type],

                grow: 1
            };
        });
    }
}