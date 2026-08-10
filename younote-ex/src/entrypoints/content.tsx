import { createRoot } from "react-dom/client";
import Notes from "../components/Notes";

export default defineContentScript({
  // wildcard to all youtube pages so the note box loads after login (was watch*)
  matches: ["*://*.youtube.com/*"], // before had to manually reload page.

  main() {
    const container = document.createElement("div");
    container.id = "yt-reflection-input";
    createRoot(container).render(<Notes />);

    const injectPanel = () => {
      // check if rec video sidebar visible
      const sidebar = document.querySelector("#secondary-inner");
      const visible = sidebar && sidebar.getBoundingClientRect().width > 0;
      
      const target = visible ? sidebar : document.querySelector("#below");

      // move panel if needed
      if (target && container.parentElement !== target) {
        target.prepend(container);
      }
    };

    // re-run on new video (SPA)
    new MutationObserver(injectPanel).observe(document.body, {
      childList: true,
      subtree: true,
    });

    // back-up
    window.addEventListener("resize", injectPanel);

    injectPanel();
  },
});