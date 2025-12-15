import { sdk } from '@farcaster/miniapp-sdk';

export type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export type FarcasterContext = {
  user: FarcasterUser | null;
  isInMiniApp: boolean;
  isReady: boolean;
};

let contextCache: FarcasterContext | null = null;
let initPromise: Promise<FarcasterContext> | null = null;

export async function initializeFarcaster(): Promise<FarcasterContext> {
  if (contextCache) return contextCache;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('SDK timeout')), 1000)
      );
      
      const context = await Promise.race([sdk.context, timeoutPromise]);
      
      if (context && context.user) {
        await sdk.actions.ready();
        
        contextCache = {
          user: {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          },
          isInMiniApp: true,
          isReady: true,
        };
      } else {
        contextCache = {
          user: null,
          isInMiniApp: false,
          isReady: true,
        };
      }
    } catch (error) {
      console.log('Not in Farcaster Mini App context');
      contextCache = {
        user: null,
        isInMiniApp: false,
        isReady: true,
      };
    }
    
    return contextCache;
  })();

  return initPromise;
}

export function getEthereumProvider() {
  try {
    return sdk.wallet.getEthereumProvider();
  } catch {
    return null;
  }
}

export { sdk };
