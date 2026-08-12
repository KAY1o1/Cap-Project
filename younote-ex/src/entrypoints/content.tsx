// this is entrypiont for injecting to into youtube

import { createRoot } from "react-dom/client";
import Notes from "../components/Notes";

export default defineContentScript({ // this is for WXT object

  matches: ["*://*.youtube.com/*"], // comma is for wxt property

  main()
  {
    const container = document.createElement("div");
    container.id = "yt-reflection-input";

    createRoot(container).render(<Notes />); // insert the Note component

    const updatePosition = () => {
    
      const sidebar = document.querySelector<HTMLElement>("#secondary-inner");
      
      let target;

      if (sidebar && sidebar.offsetWidth > 0)
      {
        target = sidebar;
      } 
      else
      {
        target = document.querySelector("#below");
      }

      if (target && container.parentElement !== target)
      {
        target.prepend(container);
      }
    };

    new MutationObserver(updatePosition).observe(document.body, { // when user clicks to another video
      childList: true, 
      subtree: true 
    });

    window.addEventListener("resize", updatePosition); // when shrinks the window
    updatePosition();
  },
});