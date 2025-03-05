const React = window.Guildium.getApiProperty("react"),
    { default: NullState } = window.Guildium.getApiProperty("guilded/components/NullState"),
    { default: CodeContainer } = window.Guildium.getApiProperty("guilded/components/CodeContainer");

export default class ErrorBoundary extends React.Component<{ }, { hasErrored: boolean, error: Error | null }> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            hasErrored: false,
            error: null
        };
    }
    componentDidCatch(error) {
        console.error(error);
        console.warn('Catched error in', this.props.children)
        this.setState({
            hasErrored: true,
            error
        });
    }
    render() {
        return this.state.hasErrored
            ? (
                <NullState
                    title="Guildium Error Occurred"
                    type="error"
                    subtitle={[
                        "Something in Guildium has broke. Be sure to report this error by submitting it as an issue in our GitHub repository (the button for it is below the error).",
                        <CodeContainer language="javascript" header="Guildium error stack is shown below" className="GuildiumErrorBoundary-error" readOnly={true} canCopyContents={true} code={this.state.error ? this.state.error.stack ?? this.state.error.toString() : "Unknown error: received undefined or null:\n" + this.state.error}/>
                    ]}
                    buttonText="Create issue"
                    onClick={() => window.GuildiumConfig.openExternal(`https://github.com/Guildium/ReGuilded/issues/new?labels=bug&title=${this.state.error.name}+${this.state.error.message.replace(/ /g, "+")}`)}/>
            )
            : this.props.children
    }
}