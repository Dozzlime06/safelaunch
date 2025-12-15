import "./polyfills";
import { createRoot } from "react-dom/client";
import { sdk } from "@farcaster/miniapp-sdk";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

sdk.actions.ready().catch(() => {
  console.log("Not in Farcaster Mini App context");
});
