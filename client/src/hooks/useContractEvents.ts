import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  watchBuyEvents, 
  watchTokenCreated, 
  watchBonded,
  type BuyEventData,
  type TokenCreatedEventData,
  type BondedEventData
} from '@/lib/safeLaunchContract';

export function useTokenListEvents() {
  const queryClient = useQueryClient();
  const unwatchRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unwatchTokenCreated = watchTokenCreated((event: TokenCreatedEventData) => {
      console.log('New token created:', event.tokenId.toString());
      queryClient.invalidateQueries({ queryKey: ['safelaunch-tokens'] });
    });

    const unwatchBuy = watchBuyEvents(null, (event: BuyEventData) => {
      console.log('Buy event for token:', event.tokenId.toString());
      queryClient.invalidateQueries({ queryKey: ['safelaunch-tokens'] });
    });

    const unwatchBonded = watchBonded(null, (event: BondedEventData) => {
      console.log('Token bonded:', event.tokenId.toString());
      queryClient.invalidateQueries({ queryKey: ['safelaunch-tokens'] });
    });

    unwatchRef.current = [unwatchTokenCreated, unwatchBuy, unwatchBonded];

    return () => {
      unwatchRef.current.forEach(unwatch => unwatch());
      unwatchRef.current = [];
    };
  }, [queryClient]);
}

export interface TokenEventCallbacks {
  onBuy?: (event: BuyEventData) => void;
  onBonded?: (event: BondedEventData) => void;
}

export function useTokenDetailEvents(tokenId: number, callbacks?: TokenEventCallbacks) {
  const queryClient = useQueryClient();
  const unwatchRef = useRef<Array<() => void>>([]);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (tokenId <= 0) return;

    const unwatchBuy = watchBuyEvents(tokenId, (event: BuyEventData) => {
      console.log('Real-time Buy event:', event);
      
      queryClient.invalidateQueries({ queryKey: ['safelaunch-token', tokenId] });
      queryClient.invalidateQueries({ queryKey: ['safelaunch-price', tokenId] });
      queryClient.invalidateQueries({ queryKey: ['safelaunch-events', tokenId] });
      
      callbacksRef.current?.onBuy?.(event);
    });

    const unwatchBonded = watchBonded(tokenId, (event: BondedEventData) => {
      console.log('Real-time Bonded event:', event);
      
      queryClient.invalidateQueries({ queryKey: ['safelaunch-token', tokenId] });
      
      callbacksRef.current?.onBonded?.(event);
    });

    unwatchRef.current = [unwatchBuy, unwatchBonded];

    return () => {
      unwatchRef.current.forEach(unwatch => unwatch());
      unwatchRef.current = [];
    };
  }, [tokenId, queryClient]);
}
