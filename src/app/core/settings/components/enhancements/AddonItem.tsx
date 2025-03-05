import { ProvidedOverlay } from "../../../../guilded/decorators";
import { Addon } from "../../../../../common/enhancements";
import EnhancementItem from "./EnhancementItem";

export default class AddonItem extends EnhancementItem<Addon, { fp: string }> {
    SimpleFormOverlay: ProvidedOverlay<"SimpleFormOverlay">;

    constructor(props, context) {
        super(props, context);

        this.state = {
            dirname: props.dirname,
            fp: props.dirname,
            enabled: window.Guildium.addons.enabled.includes(props.id)
        };

        const { switchTab } = this.props;

        this.overflowMenuSpecs.sections.push({
            name: "Addon",
            type: "rows",
            actions: [
                {
                    label: "Permissions",
                    icon: "icon-filter",
                    onClick: () => switchTab("specific", { enhancement: this.props, defaultTabIndex: 1 }),
                }
            ]
        });
    }
    protected override async onToggle(enabled: boolean): Promise<void> {
        await window.Guildium.addons[enabled ? "savedLoad" : "savedUnload"](this.props)
            .then(() => this.setState({ enabled }));
    }
}