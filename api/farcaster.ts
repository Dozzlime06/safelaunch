import type { VercelRequest, VercelResponse } from '@vercel/node';

const manifest = {
  "frame": {
    "version": "1",
    "name": "SafeLaunch",
    "iconUrl": "https://safelaunch.vercel.app/icon.png",
    "splashImageUrl": "https://safelaunch.vercel.app/splash.png", 
    "splashBackgroundColor": "#0a0a0a",
    "homeUrl": "https://safelaunch.vercel.app"
  }
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(manifest);
}
