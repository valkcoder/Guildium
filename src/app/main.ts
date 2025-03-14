import { members } from "./core/badges-flairs";
import Guildium from "./core/Guildium";
import webpackPush from "./webpackInject";

window.Guildium = new Guildium();

function setPush(obj) {
    Object.defineProperty(window.webpackJsonp, "push", obj);
}

let hasInjected = false;
function setUpWebpackInjection() {
    // To wait for the bundle to be created
    if (document.readyState === "interactive" && window.bundle)
        // Wait when bundle loads
        window.bundle.addEventListener("load", injectWebpackJsonp);
    // Still try injecting even if it was too late
    else if (!hasInjected && document.readyState === "complete" && window.webpackJsonp) {
        console.warn(
            "WebpackJsonp injection is too late. Still injecting. This may require loading a bundle that has not been loaded yet. If Guildium hasn't loaded yet, make sure to load settings or area that you have not yet viewed or refresh Guilded."
        );
        injectWebpackJsonp();
    }
}
function injectWebpackJsonp() {
    hasInjected = true;

    // Saves the old push
    window.webpackJsonp._push = window.webpackJsonp.push;

    setPush({
        get: () => webpackPush.bind(window.webpackJsonp),
        set: value => setPush({ get: () => value })
    });
}

// Inject if it's possible yet, or wait for it to be possible
if (document.readyState !== "loading") setUpWebpackInjection();
else document.addEventListener("readystatechange", setUpWebpackInjection);

// Fetch Guildium things
(async () => {
    // Global badge holders
    await fetch("https://api.reguilded.dev/team")
        .then(
            response => response.json(),
            e => console.warn("Failed to fetch Guildium badges:", e)
        )
        .then(
            json => {
                members.dev = json.coreDevelopers.map(member => member.guildedId);
                members.contrib = json.contributors.map(member => member.guildedId)
                  .concat(json.socialMediaManagers.map(member => member.guildedId),
                    json.translators.map(member => member.guildedId));
            },
            e => console.warn("Failed to fetch Guildium badges:", e)
        );
})();
