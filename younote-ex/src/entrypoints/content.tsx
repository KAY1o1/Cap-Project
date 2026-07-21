import { createRoot } from "react-dom/client";
import Notes from "../components/Notes";

export default defineContentScript({
  // wildcard to all youtube pages so the note box loads after login (was watch*)
  matches: ["*://*.youtube.com/*"], // before had to manually reload page.

  main() {
    const injectInput = () => {
      if (document.getElementById("yt-reflection-input")) return;

      const sidebar = document.querySelector("#secondary-inner");
      if (!sidebar) return;

      const container = document.createElement("div");
      container.id = "yt-reflection-input";

      sidebar.prepend(container);

      const root = createRoot(container);
      root.render(<Notes />);
    };

    const observer = new MutationObserver(injectInput);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    injectInput();
  },
});