import { ProvidedOverlay } from "../../../../guilded/decorators";
import { AnyEnhancement } from "../../../../../common/enhancements";
import { RGEnhancementConfig } from "../../../../types/guildium";
import EnhancementHandler from "../../../handlers/enhancement";
import { ChildTabProps } from "../TabbedSettings";
import PreviewCarousel from "./PreviewCarousel";
import ErrorBoundary from "../ErrorBoundary";
import { ReactElement } from "react";
import { FormOutput } from "../../../../guilded/form";

const React = window.Guildium.getApiProperty("react"),
    { default: ScreenHeader } = window.Guildium.getApiProperty("guilded/components/ScreenHeader"),
    { default: Form } = window.Guildium.getApiProperty("guilded/components/Form"),
    { default: overlayProvider } = window.Guildium.getApiProperty("guilded/overlays/overlayProvider"),
    { default: savableSettings } = window.Guildium.getApiProperty("guilded/settings/savableSettings"),
    { default: defaultContextProvider } = window.Guildium.getApiProperty("guilded/context/defaultContextProvider"),
    { coroutine } = window.Guildium.getApiProperty("guilded/util/functions"),
    { default: MarkdownRenderer } = window.Guildium.getApiProperty("guilded/components/MarkdownRenderer"),
    { default: { WebhookEmbed } } = window.Guildium.getApiProperty("guilded/editor/grammars"),
    { default: HorizontalTabs } = window.Guildium.getApiProperty("guilded/components/HorizontalTabs");

type Props<T> = ChildTabProps & { enhancement: T };

@savableSettings
@defaultContextProvider
@overlayProvider(["DeleteConfirmationOverlay"])
export default abstract class EnhancementView<T extends AnyEnhancement> extends React.Component<Props<T>, { enabled: boolean | number }> {
    // Class functions with proper `this` to not rebind every time
    private _onToggleBinded: () => Promise<void>;
    private _onDeleteBinded: () => Promise<void>;

    // Configuration
    protected type: string;
    protected enhancementHandler: EnhancementHandler<T, RGEnhancementConfig<T>>;
    protected tabs = [{ name: "Overview" }];

    // From decorators
    protected DeleteConfirmationOverlay: ProvidedOverlay<"DeleteConfirmationOverlay">;
    protected SaveChanges: (...args: any[]) => any;
    protected Save: () => Promise<void>;
    protected _handleOptionsChange: (...args: any[]) => void;
    protected _handleSaveChangesClick: () => Promise<void>;

    constructor(props: Props<T>, context?: any) {
        super(props, context);

        this.state = {
            enabled: ~window.Guildium.themes.enabled.indexOf(this.props.enhancement.id)
        };

        this._onToggleBinded = this._onToggle.bind(this);
        this._onDeleteBinded = this._onDelete.bind(this);
        this.SaveChanges = coroutine(this.onSaveChanges);
    }
    protected abstract onSaveChanges(formOutput: FormOutput): Iterable<PromiseLike<unknown>>;
    /**
     * Toggles the enhancement's enabled state.
     * @param enabled The new enhancement state
     */
    private async _onToggle(): Promise<void> {
        await this.enhancementHandler[this.state.enabled ? "savedUnload" : "savedLoad"](this.props.enhancement)
            .then(() => this.setState({ enabled: !this.state.enabled }));
    }
    /**
     * Confirms whether the enhancement should be deleted and deletes it if the modal is confirmed.
     */
    private async _onDelete(): Promise<void> {
        await this.DeleteConfirmationOverlay.Open({ name: this.type })
            .then(async ({ confirmed }) => confirmed && await this.enhancementHandler.delete(this.props.enhancement))
            // To not stay in the screen and break something
            .then(() => this.props.switchTab('list', { enhancement: {} }));
    }
    /**
     * Renders additional content for the enhancement.
     * @param enhancement The current enhancement
     * @returns Additional content
     */
    protected abstract renderTabs(enhancement: T): ReactElement | ReactElement[];
    /**
     * Returns the action form component depending on the state.
     * @returns Form element
     */
    private renderActionForm(): ReactElement {
        const [buttonType, buttonText] = this.state.enabled ? ["delete", "Disable"] : ["success", "Enable"],
            { _onToggleBinded, _onDeleteBinded } = this;

        return (
            <ErrorBoundary>
                <Form formSpecs={{
                    sectionStyle: "border-unpadded",
                    sections: [
                        {
                            header: "Actions",
                            fieldSpecs: [
                                {
                                    type: "Button",
                                    fieldName: "stateChange",
                                    buttonText,

                                    buttonType,
                                    grow: 0,
                                    rowCollapseId: "button-list",

                                    onClick: _onToggleBinded
                                },
                                {
                                    type: "Button",
                                    fieldName: "directory",
                                    buttonText: "Open directory",

                                    buttonType: "bleached",
                                    style: "hollow",
                                    grow: 0,
                                    rowCollapseId: "button-list",

                                    onClick: () => window.GuildiumConfig.openItem(this.props.enhancement.dirname)
                                },
                                {
                                    type: "Button",
                                    fieldName: "delete",
                                    buttonText: "Delete",

                                    buttonType: "delete",
                                    style: "hollow",
                                    grow: 0,
                                    rowCollapseId: "button-list",

                                    onClick: _onDeleteBinded
                                }
                            ]
                        }
                    ]
                }} />
            </ErrorBoundary>
        );
    }
    render() {
        const { props: { switchTab, enhancement, defaultTabIndex }, tabs } = this;

        return (
            <ErrorBoundary>
                <div className="GuildiumEnhancementPage-wrapper">
                    <div className="GuildiumEnhancementPage-container">
                        <ScreenHeader className="GuildiumEnhancementPage-screen-header"
                            isBackLinkVisible
                            onBackClick={() => switchTab("list", { enhancement: {} })}
                            name={enhancement.name + " settings"} />
                        <div className="GuildiumSettings-container GuildiumSettings-container-padded GuildiumSettings-container-top-padded">
                            <HorizontalTabs type="compact" renderAllChildren={false} tabSpecs={{ TabOptions: tabs }} defaultSelectedTabIndex={defaultTabIndex}>
                                <div className="GuildiumEnhancementPage-tab">
                                    {/* Description */}
                                    {enhancement.readme?.length ? <MarkdownRenderer plainText={enhancement.readme} grammar={WebhookEmbed} /> : null}
                                    {/* Preview images carousel */}
                                    {enhancement.images && window.Guildium.settingsHandler.settings.loadImages &&
                                        <PreviewCarousel enhancementId={enhancement.id} enhancementHandler={this.enhancementHandler} />
                                    }
                                    {this.renderActionForm()}
                                </div>
                                {this.renderTabs(enhancement)}
                            </HorizontalTabs>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        )
    }
}