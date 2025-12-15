import type { Express } from "express";
import { type Server } from "http";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Farcaster Mini App manifest - serve with proper headers for embedding
  app.get("/.well-known/farcaster.json", (req, res) => {
    const manifestPath = path.resolve(process.cwd(), "client/public/.well-known/farcaster.json");
    try {
      const manifest = fs.readFileSync(manifestPath, "utf-8");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(manifest);
    } catch (e) {
      res.status(404).json({ error: "Manifest not found" });
    }
  });

  // Allow Warpcast to embed this app - remove frame restrictions
  app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://*.farcaster.xyz");
    next();
  });


  return httpServer;
}
