"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InventoryContextType {
  addRevives: (count: number) => void;
  useRevive: () => boolean; // Returns true if a revive was used, false otherwise
  reviveCount: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [reviveCount, setReviveCount] = useState(0);

  const addRevives = (count: number) => {
    setReviveCount(prev => prev + count);
  };

  const useRevive = () => {
    if (reviveCount > 0) {
      setReviveCount(prev => prev - 1);
      return true;
    }
    return false;
  };

  return (
    <InventoryContext.Provider value={{ addRevives, useRevive, reviveCount }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
