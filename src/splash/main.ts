import guildiumInfo from "../common/guildium.json";

let guildiumSplashFooter = document.createElement("div");
guildiumSplashFooter.innerText = guildiumInfo.version + " - Guildium";
guildiumSplashFooter.id = "guildiumSplashFooter"

const cssText = "color: #a3a3ac;" +
    "   position: fixed;" +
    "   bottom: 0;" +
    "   margin: 8px;" +
    "   font-family: GothamNarrowSSm;" +
    "   font-size: 18px;" +
    "   text-align: center"
guildiumSplashFooter.setAttribute("style", cssText);

const elementExists = setInterval(function() {
    if (document.getElementById("splashTextBlock") != null) {
        document.getElementById("splashTextBlock").append(guildiumSplashFooter);
        clearInterval(elementExists);
    }
}, 250);
