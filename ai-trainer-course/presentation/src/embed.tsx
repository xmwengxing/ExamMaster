import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/animations.css";
import { createRoot } from "react-dom/client";
import App from "./App";

const params = new URLSearchParams(location.search);
const chapterParam = params.get("chapter");
if (chapterParam !== null) {
  const chapterIdx = parseInt(chapterParam, 10);
  if (!isNaN(chapterIdx)) {
    try {
      sessionStorage.setItem(
        "presentation-init-chapter",
        JSON.stringify({ chapter: chapterIdx, step: 0 })
      );
    } catch {}
  }
}

createRoot(document.getElementById("root")!).render(<App />);
