"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const WALLET_STORAGE_KEY = 'serpens-fortuna-wallet';
const INITIAL_BONUS = 10.00;

interface WalletContextType {
  balance: number;
  spend: (amount: number) => boolean;
  deposit: (amount: number) => void;
  earn: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize with a value that is consistent for server and client.
  const [balance, setBalance] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 2. Load the value from localStorage only on the client, after mount.
  useEffect(() => {
    try {
      const savedBalance = localStorage.getItem(WALLET_STORAGE_KEY);
      if (savedBalance !== null) {
        setBalance(JSON.parse(savedBalance));
      } else {
        // If no saved balance, this is the first time, grant the bonus.
        setBalance(INITIAL_BONUS);
      }
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 3. Sync balance changes back to localStorage, only after initialization.
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(balance));
    }
  }, [balance, isInitialized]);

  const spend = (amount: number): boolean => {
    if (balance >= amount) {
      setBalance((prevBalance) => prevBalance - amount);
      return true;
    }
    return false;
  };

  const deposit = (amount: number) => {
    if (amount > 0) {
      setBalance((prevBalance) => prevBalance + amount);
    }
  };
  
  const earn = (amount: number) => {
    if (amount > 0) {
      setBalance((prevBalance) => prevBalance + amount);
    }
  };

  return (
    <WalletContext.Provider value={{ balance, spend, deposit, earn }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
