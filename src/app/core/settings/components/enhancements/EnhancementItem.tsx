import { AnyEnhancement } from "../../../../../common/enhancements";
import { MenuSpecs } from "../../../../guilded/menu";
import { UserInfo } from "../../../../guilded/models";
import ErrorBoundary from "../ErrorBoundary";
import { SwitchTab } from "../TabbedSettings";

const React = window.Guildium.getApiProperty("react"),
    { default: OverflowButton } = window.Guildium.getApiProperty("guilded/components/OverflowButton"),
    { default: CardWrapper } = window.Guildium.getApiProperty("guilded/components/CardWrapper"),
    { default: SwitchInput } = window.Guildium.getApiProperty("guilded/components/SwitchInput"),
    { default: ToggleFieldWrapper } = window.Guildium.getApiProperty("guilded/components/ToggleFieldWrapper"),
    { default: UserBasicInfoDisplay } = window.Guildium.getApiProperty("guilded/components/UserBasicInfoDisplay"),
    { default: GuildedText } = window.Guildium.getApiProperty("guilded/components/GuildedText"),
    { default: StretchFadeBackground } = window.Guildium.getApiProperty("guilded/components/StretchFadeBackground"),
    { UserModel } = window.Guildium.getApiProperty("guilded/users"),
    { default: restMethods } = window.Guildium.getApiProperty("guilded/http/rest"),
    { default: MarkdownRenderer } = window.Guildium.getApiProperty("guilded/components/MarkdownRenderer"),
    { default: { WebhookEmbed } } = window.Guildium.getApiProperty("guilded/editor/grammars");

type AdditionalProps = {
    type: string,
    switchTab: SwitchTab
};
type State = {
    enabled: boolean,
    dirname: string,
    author?: UserInfo
};

export default abstract class EnhancementItem<P extends AnyEnhancement, S = {}> extends React.Component<P & AdditionalProps, State & S> {
    protected overflowMenuSpecs: MenuSpecs;
    private hasToggled: boolean;
    private _onToggleBinded: (enabled: boolean) => Promise<void>;

    constructor(props, context) {
        super(props, context);

        // Can't put it into props because of JavaScript schenanigans
        this.overflowMenuSpecs = {
            id: "EnhancementMenu",
            sections: [
                {
                    name: "Enhancement",
                    header: "Enhancement",
                    type: "rows",
                    actions: [
                        {
                            label: "Open directory",
                            icon: "icon-team-stream-popout",
                            onClick: () => window.GuildiumConfig.openItem(this.state?.dirname)
                        }
                    ]
                }
            ]
        };
        this.hasToggled = false;
    }
    protected abstract onToggle(enabled: boolean): Promise<void>;
    async componentWillMount() {
        if (this.props.author && window.Guildium.settingsHandler.settings.loadAuthors) {
            await restMethods.getUserById(this.props.author)
                .then(userInfo => this.setState({author: userInfo.user}))
                .catch(() => {});
        }
    }
    render() {
        const { overflowMenuSpecs, props: { id, name, readme, version, switchTab, banner }, state: { enabled } } = this;

        const readmeLength = readme?.length;
        const toggleName = id + "-toggle";

        return (
            <CardWrapper isStandalone className={"GuildiumEnhancement-container GuildiumEnhancement-container-" + (enabled ? "enabled" : "disabled") } onClick={() => switchTab("specific", { enhancement: this.props })}>
                <div className="GuildiumEnhancement-top">
                    {/* Banner */}
                    <StretchFadeBackground type="full-blur" className="GuildiumEnhancement-banner" position="centered" src={banner || "/asset/TeamSplash/Minecraft-sm.jpg"} />
                    {/* Header */}
                    <div className="GuildiumEnhancement-header">
                        {/* Icon can be inputed here, if it will be ever necessary */}
                        {/* Header info */}
                        <div className="PlayerCardGameInfo-name-alias" onClick={e => e.stopPropagation()}>
                            {/* Name + Toggle */}
                            <ToggleFieldWrapper fieldSpec={{ label: name, fieldName: toggleName, defaultValue: enabled }}>
                                <SwitchInput
                                    fieldName={toggleName}
                                    label={name}
                                    defaultValue={enabled}
                                    onChangeFireImmediately={false}
                                    onChange={async (newState: boolean) => (this.hasToggled || (newState !== enabled && typeof newState !== "number")) && (this.hasToggled = true, await this.onToggle(newState))}/>
                            </ToggleFieldWrapper>
                            <GuildedText type="subtext" block={true} className="GuildiumEnhancement-version">{ version ? `Version ${version}` : "Latest release" }</GuildedText>
                            <div className="GuildiumEnhancement-author">
                                { this.state.author
                                    ? <UserBasicInfoDisplay size="sm" user={new UserModel(this.state.author)} />
                                    : <GuildedText className="GuildiumEnhancement-no-author" block={true} type="subtext">{this.props.author ? "By user " + this.props.author : "Unknown author"}</GuildedText>
                                }
                            </div>
                        </div>
                    </div>
                    {/* Settings */}
                    <ErrorBoundary>
                        <OverflowButton className="GuildiumEnhancement-overflow" type="light" menuSpecs={overflowMenuSpecs}/>
                    </ErrorBoundary>
                </div>
                <div className="GuildiumEnhancement-footer">
                    {/* Description */}
                    <div className="GuildiumEnhancement-description">
                        { readmeLength
                            ? <MarkdownRenderer plainText={(readmeLength > 150 ? readme.slice(0, 150) + "..." : readme)} grammar={WebhookEmbed}/>
                            : <GuildedText type="gray" block={true}>No description provided.</GuildedText> }
                    </div>
                </div>
            </CardWrapper>
        );
    }
}