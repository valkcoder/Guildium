import { AnyEnhancement } from "../../../../../common/enhancements";
import { RGEnhancementConfig } from "../../../../types/guildium";
import EnhancementHandler from "../../../handlers/enhancement";

const React = window.Guildium.getApiProperty("react"),
    { default: GuildedText } = window.Guildium.getApiProperty("guilded/components/GuildedText"),
    { default: CarouselList } = window.Guildium.getApiProperty("guilded/components/CarouselList"),
    { default: MediaRenderer } = window.Guildium.getApiProperty("guilded/components/MediaRenderer"),
    { default: LoadingPage } = window.Guildium.getApiProperty("guilded/components/LoadingPage");

type Props<T extends AnyEnhancement> = { enhancementId: string, enhancementHandler: EnhancementHandler<T, RGEnhancementConfig<T>> }

export default class PreviewCarousel<T extends AnyEnhancement> extends React.Component<Props<T>, { images?: string[] }> {
    constructor(props: Props<T>, context?: any) {
        super(props, context);

        this.state = {};
    }
    componentDidMount() {
        // Because it freezes without rendering page
        setTimeout(() => {
            // Update it to no longer have loading screen
            this.props.enhancementHandler.config.fetchImagesOf(this.props.enhancementId, images => {
                this.setState({ images })
            });
        }, 250);
    }
    render() {
        const { images } = this.state;

        return (
            <div className="GuildiumEnhancementImages-container">
                <GuildedText className="GuildiumEnhancementImages-heading" type="heading2" block={true}>Preview</GuildedText>
                {images
                    ? <CarouselList scrollOnChildrenChange={true} arrowSize="md" className="GuildiumEnhancementImages-list" minHeight={108}>
                        {images.map(image => <div className="GuildiumEnhancementImages-image"><MediaRenderer src={image} className="MediaRenderer-content" /></div>)}
                    </CarouselList>
                    : <LoadingPage />
                }
            </div>
        )
    }
}