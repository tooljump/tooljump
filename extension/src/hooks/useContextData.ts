import { useState, useEffect } from 'react';
import { Context } from '../adapters/types';
import { DataItem } from '../types';
import { ContextService } from '../utils/contextService';
import { logger } from '../utils/logger';

interface UseContextDataResult {
  data: DataItem[];
  isVisible: boolean;
  sendContext: (context: Context, componentName: string) => Promise<void>;
}

export const useContextData = (contexts?: Context[]): UseContextDataResult => {
  const [data, setData] = useState<DataItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Function to send context to server
  const sendContext = async (context: Context, componentName: string) => {
    const data = await ContextService.sendContext(context, componentName);
    
    if (data.length > 0) {
      setData(data);
      setIsVisible(true);
      logger.debug(componentName, `UI set to visible with ${data.length} items`);
    } else {
      setIsVisible(false);
      logger.debug(componentName, 'No data returned, hiding UI');
    }
  };

  useEffect(() => {
    if (contexts && contexts.length > 0) {
      const context = contexts[0];
      sendContext(context, 'useContextData');
    }
  }, [contexts]);

  return {
    data,
    isVisible,
    sendContext,
  };
};
