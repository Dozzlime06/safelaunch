import { useState, useEffect } from 'react';
import { initializeFarcaster, type FarcasterContext, type FarcasterUser } from '@/lib/farcaster';

export function useFarcaster() {
  const [context, setContext] = useState<FarcasterContext>({
    user: null,
    isInMiniApp: false,
    isReady: false,
  });

  useEffect(() => {
    initializeFarcaster().then(setContext);
  }, []);

  return context;
}

export function useFarcasterUser(): FarcasterUser | null {
  const { user } = useFarcaster();
  return user;
}
