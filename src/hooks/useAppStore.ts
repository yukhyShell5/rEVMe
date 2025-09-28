import { useEffect, useState } from 'react';
import { appStore } from '../store/AppStore';

export const useAppStore = () => {
  const [state, setState] = useState(appStore.getState());

  useEffect(() => {
    const unsubscribe = appStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    state,
    loadBytecodeFile: () => appStore.loadBytecodeFile(),
    toggleDebugPanel: () => appStore.toggleDebugPanel(),
  };
};
