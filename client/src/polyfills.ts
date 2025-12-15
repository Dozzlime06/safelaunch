import { Buffer } from "buffer";

declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: { env: Record<string, string> };
  }
}

window.global = window.global ?? window;
window.Buffer = window.Buffer ?? Buffer;
window.process = window.process ?? { env: {} };
