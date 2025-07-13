
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const APP_STORAGE_KEY = 'serpens-fortuna-app-data';

// Data Structures
export interface User {
  id: string;
  profile: {
    name: string;
    email: string;
    avatar: string;
    referralCode: string;
  };
  password?: string;
  wallet: {
    balance: number;
    totalDeposits: number;
  };
  inventory: {
    reviveCount: number;
    obstacleShieldCount: number;
  };
  referrals: {
    id: string; // Unique ID for the referral relationship
    username: string;
    date: string;
    status: "Active" | "Inactive";
    earnings: number;
  }[];
  stats: {
    roundsPlayed: number;
    wins: number;
    winRate: number;
  };
  status: 'Active' | 'Suspended';
  referredBy?: string;
  withdrawalUnlockTime?: string;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  proof: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number; // The amount the user *requested* to withdraw
  address: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface AppState {
  users: User[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  activeUserEmail: string | null;
}

interface UserContextType {
  isInitialized: boolean;
  user: User | null;
  stats: User['stats'];
  wallet: User['wallet'];
  inventory: User['inventory'];
  referrals: User['referrals'];
  spend: (amount: number) => boolean;
  deposit: (details: { amount: number; proof: string }) => void;
  withdraw: (details: { amount: number, address: string }) => boolean;
  earn: (amount: number) => void;
  addRevives: (count: number) => void;
  useRevive: () => { success: boolean, remaining: number };
  addObstacleShield: () => void;
  useObstacleShield: () => boolean;
  getReferralStats: () => { totalReferrals: number; activeReferrals: number; totalEarnings: number };
  getTransactions: () => ({ type: 'deposit' | 'withdrawal' } & (Deposit | Withdrawal))[];
  recordGameResult: (didWin: boolean) => void;
  getQualifyingReferralsCount: () => number;
  
  login: (emailOrUsername: string, password: string) => boolean;
  logout: () => void;
  signUp: (details: any) => { success: boolean; message?: string; bonus?: number };

  getAllUsers: () => User[];
  getAllDeposits: () => (Deposit & { user?: User })[];
  getAllWithdrawals: () => (Withdrawal & { user?: User })[];
  updateUserStatus: (userId: string, status: 'Active' | 'Suspended') => void;
  approveTransaction: (id: string, type: 'deposit' | 'withdrawal') => void;
  rejectTransaction: (id: string, type: 'deposit' | 'withdrawal') => void;
}

const initialAppState: AppState = {
  users: [],
  deposits: [],
  withdrawals: [],
  activeUserEmail: null,
};


const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(APP_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setAppState(parsedState);
      } else {
        setAppState(initialAppState);
      }
    } catch (error) {
        console.error("Failed to load app data from localStorage", error);
        setAppState(initialAppState);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
      } catch (error) {
        console.error("Failed to save app data to localStorage", error);
      }
    }
  }, [appState, isInitialized]);

  const activeUser = appState.users.find(u => u.profile.email === appState.activeUserEmail) || null;

  const updateUser = useCallback((userId: string, updater: (currentUser: User) => User) => {
    setAppState(current => ({
      ...current,
      users: current.users.map(u => u.id === userId ? updater(u) : u),
    }));
  }, []);

  const login = useCallback((emailOrUsername: string, password: string): boolean => {
    const userToLogin = appState.users.find(u => (u.profile.email === emailOrUsername || u.profile.name === emailOrUsername) && u.password === password);
    if (userToLogin && userToLogin.status === 'Active') {
      setAppState(current => ({ ...current, activeUserEmail: userToLogin.profile.email }));
      return true;
    }
    return false;
  }, [appState.users]);

  const logout = useCallback(() => {
    setAppState(current => ({ ...current, activeUserEmail: null }));
  }, []);

  const signUp = useCallback((details: any) => {
    let success = false;
    let message = '';
    const bonus = 5.00;

    setAppState(current => {
      if (current.users.some(u => u.profile.email === details.email)) {
        message = "An account with this email already exists.";
        return current;
      }
      if (current.users.some(u => u.profile.name === details.username)) {
        message = "Username is already taken.";
        return current;
      }

      const newUser: User = {
        id: `USR${Date.now()}`,
        profile: {
          name: details.username,
          email: details.email,
          avatar: "https://placehold.co/100x100.png",
          referralCode: `${details.username.toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        },
        password: details.password,
        wallet: { balance: bonus, totalDeposits: 0 },
        inventory: { reviveCount: 0, obstacleShieldCount: 0 },
        referrals: [],
        stats: { roundsPlayed: 0, wins: 0, winRate: 0 },
        status: 'Active',
        referredBy: details.referralCode || undefined,
      };
      
      let updatedUsers = [...current.users, newUser];

      // If a valid referral code was used, find the referrer and update their referral list.
      if (details.referralCode) {
          const referrerIndex = updatedUsers.findIndex(u => u.profile.referralCode === details.referralCode);
          if (referrerIndex !== -1) {
              const referrer = updatedUsers[referrerIndex];
              const updatedReferrer = {
                  ...referrer,
                  referrals: [...referrer.referrals, {
                      id: `REF${Date.now()}`,
                      username: newUser.profile.name,
                      date: new Date().toISOString(),
                      status: 'Inactive' as const, // Referrals start as inactive
                      earnings: 0
                  }]
              };
              updatedUsers[referrerIndex] = updatedReferrer;
          }
      }
      
      success = true;
      return { ...current, users: updatedUsers };
    });
    
    return { success, message, bonus: success ? bonus : undefined };
  }, []);

  const getQualifyingReferralsCount = useCallback(() => {
    if (!activeUser) return 0;
    
    const referredUsernames = activeUser.referrals.map(r => r.username);
    const referredUsers = appState.users.filter(u => referredUsernames.includes(u.profile.name));
    
    const qualifyingCount = referredUsers.filter(u => u.wallet.totalDeposits >= 100).length;
    
    return qualifyingCount;
  }, [activeUser, appState.users]);

  const spend = useCallback((amount: number): boolean => {
    if (activeUser && activeUser.wallet.balance >= amount) {
      updateUser(activeUser.id, u => ({ ...u, wallet: { ...u.wallet, balance: u.wallet.balance - amount }}));
      return true;
    }
    return false;
  }, [activeUser, updateUser]);

  const deposit = useCallback((details: {amount: number; proof: string}) => {
    if (!activeUser) return;
    const newDeposit: Deposit = {
        id: `DEP${Date.now()}`,
        userId: activeUser.id,
        proof: details.proof,
        date: new Date().toISOString(),
        status: 'Pending',
        amount: details.amount,
    }
    setAppState(current => ({...current, deposits: [...current.deposits, newDeposit]}));
  }, [activeUser]);

  const withdraw = useCallback((details: { amount: number; address: string }): boolean => {
    if (!activeUser) return false;

    const { amount, address } = details;
    const canWithdraw = getQualifyingReferralsCount() >= 5;
    const withdrawalFee = 0.03; // 3% fee
    const amountToDeduct = amount * (1 + withdrawalFee);

    if (!canWithdraw || amount <= 0 || amountToDeduct > activeUser.wallet.balance) {
        return false;
    }

    const newWithdrawal: Withdrawal = {
        id: `WTH${Date.now()}`,
        userId: activeUser.id,
        amount: amount, // Store the requested amount
        address: address,
        date: new Date().toISOString(),
        status: 'Pending',
    };

    // Deduct from balance immediately on request, including the fee
    updateUser(activeUser.id, u => ({
        ...u,
        wallet: { ...u.wallet, balance: u.wallet.balance - amountToDeduct }
    }));
    
    setAppState(current => ({
        ...current,
        withdrawals: [...current.withdrawals, newWithdrawal]
    }));
    
    return true;

  }, [activeUser, updateUser, getQualifyingReferralsCount]);

  const earn = useCallback((amount: number) => {
    if (activeUser && amount > 0) {
      updateUser(activeUser.id, u => ({...u, wallet: { ...u.wallet, balance: u.wallet.balance + amount }}));
    }
  }, [activeUser, updateUser]);

  const addRevives = useCallback((count: number) => {
    if(activeUser) {
      updateUser(activeUser.id, u => ({ ...u, inventory: { ...u.inventory, reviveCount: u.inventory.reviveCount + count }}));
    }
  }, [activeUser, updateUser]);

  const useRevive = useCallback(() => {
    let result = { success: false, remaining: 0 };
    if (!activeUser) return result;

    setAppState(current => {
        const userIndex = current.users.findIndex(u => u.id === activeUser.id);
        if (userIndex === -1) {
            result = { success: false, remaining: 0 };
            return current;
        }

        const currentUser = current.users[userIndex];
        if (currentUser.inventory.reviveCount > 0) {
            const updatedUsers = [...current.users];
            const newReviveCount = currentUser.inventory.reviveCount - 1;
            updatedUsers[userIndex] = {
                ...currentUser,
                inventory: {
                    ...currentUser.inventory,
                    reviveCount: newReviveCount
                }
            };
            result = { success: true, remaining: newReviveCount };
            return { ...current, users: updatedUsers };
        } else {
            result = { success: false, remaining: 0 };
            return current;
        }
    });

    return result;
  }, [activeUser?.id]);
  
  const addObstacleShield = useCallback(() => {
    if(activeUser) {
      updateUser(activeUser.id, u => ({ ...u, inventory: { ...u.inventory, obstacleShieldCount: u.inventory.obstacleShieldCount + 1 }}));
    }
  }, [activeUser, updateUser]);

  const useObstacleShield = useCallback(() => {
    if (activeUser && activeUser.inventory.obstacleShieldCount > 0) {
      updateUser(activeUser.id, u => ({ ...u, inventory: { ...u.inventory, obstacleShieldCount: u.inventory.obstacleShieldCount - 1 }}));
      return true;
    }
    return false;
  }, [activeUser, updateUser]);

  const recordGameResult = useCallback((didWin: boolean) => {
    if (!activeUser) return;
    updateUser(activeUser.id, u => {
      const newRoundsPlayed = u.stats.roundsPlayed + 1;
      const newWins = didWin ? u.stats.wins + 1 : u.stats.wins;
      const newWinRate = newRoundsPlayed > 0 ? (newWins / newRoundsPlayed) * 100 : 0;
      return {
        ...u,
        stats: {
          roundsPlayed: newRoundsPlayed,
          wins: newWins,
          winRate: Math.round(newWinRate),
        }
      };
    });
  }, [activeUser, updateUser]);
  
  const getAllUsers = useCallback(() => appState.users, [appState.users]);
  
  const getAllDeposits = useCallback(() => {
    return appState.deposits.map(d => ({...d, user: appState.users.find(u => u.id === d.userId) }));
  }, [appState.deposits, appState.users]);

  const getAllWithdrawals = useCallback(() => {
      return appState.withdrawals.map(w => ({...w, user: appState.users.find(u => u.id === w.userId) }));
  }, [appState.withdrawals, appState.users]);

  const updateUserStatus = useCallback((userId: string, status: 'Active' | 'Suspended') => {
    updateUser(userId, u => ({...u, status}));
  }, [updateUser]);

  const approveTransaction = useCallback((id: string, type: 'deposit' | 'withdrawal') => {
    setAppState(current => {
        if (type === 'deposit') {
            const deposit = current.deposits.find(d => d.id === id);
            if (!deposit || deposit.status !== 'Pending') return current;

            const depositFee = 0.01; // 1% platform fee.
            const commission = deposit.amount * 0.01; // 1% for referrer
            const amountToCreditUser = deposit.amount * (1 - depositFee);
            
            let newUsers = [...current.users];
            const userToUpdateIndex = newUsers.findIndex(u => u.id === deposit.userId);
            
            if (userToUpdateIndex === -1) return current;

            let userToUpdate = {...newUsers[userToUpdateIndex]};

            // 1. Update depositor's balance and total deposits
            userToUpdate = {
                ...userToUpdate,
                wallet: {
                    balance: userToUpdate.wallet.balance + amountToCreditUser,
                    totalDeposits: userToUpdate.wallet.totalDeposits + deposit.amount
                }
            };
            
            // 2. Find and update the referrer, if one exists
            if (userToUpdate.referredBy) {
                const referrerIndex = newUsers.findIndex(u => u.profile.referralCode === userToUpdate.referredBy);
                if (referrerIndex !== -1) {
                    const referrer = {...newUsers[referrerIndex]};
                    newUsers[referrerIndex] = {
                        ...referrer,
                        wallet: { ...referrer.wallet, balance: referrer.wallet.balance + commission },
                        referrals: referrer.referrals.map(ref => 
                            ref.username === userToUpdate.profile.name 
                                ? {...ref, status: 'Active', earnings: ref.earnings + commission} 
                                : ref
                        )
                    };
                }
            }

            // 3. Check for withdrawal eligibility and set unlock time if newly eligible
            const referredUsernames = (userToUpdate.referrals || []).map(r => r.username);
            const referredUsers = newUsers.filter(u => referredUsernames.includes(u.profile.name));
            const qualifyingReferralsCount = referredUsers.filter(u => u.wallet.totalDeposits >= 100).length;

            if (qualifyingReferralsCount >= 5 && !userToUpdate.withdrawalUnlockTime) {
                userToUpdate.withdrawalUnlockTime = new Date().toISOString();
            }

            newUsers[userToUpdateIndex] = userToUpdate;

            return {
                ...current,
                users: newUsers,
                deposits: current.deposits.map(d => d.id === id ? {...d, status: 'Approved'} : d)
            };
        } else { // Withdrawal
            const withdrawal = current.withdrawals.find(w => w.id === id);
            if (!withdrawal || withdrawal.status !== 'Pending') return current;
            // The money (including fee) is already deducted upon request, so we just approve the status
            return {
                ...current,
                withdrawals: current.withdrawals.map(w => w.id === id ? {...w, status: 'Approved'} : w)
            };
        }
    });
  }, []);
  
  const rejectTransaction = useCallback((id: string, type: 'deposit' | 'withdrawal') => {
     if (type === 'deposit') {
        // Just mark as rejected, no balance change needed
        setAppState(current => ({...current, deposits: current.deposits.map(d => d.id === id ? {...d, status: 'Rejected'} : d) }));
     } else { // Withdrawal
        const withdrawal = appState.withdrawals.find(w => w.id === id);
        if (!withdrawal || withdrawal.status !== 'Pending') return;
        
        // Refund the money (including fee) to the user's wallet since it was deducted on request
        const withdrawalFee = 0.03;
        const amountToRefund = withdrawal.amount * (1 + withdrawalFee);
        updateUser(withdrawal.userId, u => ({...u, wallet: { ...u.wallet, balance: u.wallet.balance + amountToRefund}}));
        
        // Mark the withdrawal as rejected
        setAppState(current => ({...current, withdrawals: current.withdrawals.map(w => w.id === id ? {...w, status: 'Rejected'} : w)}));
     }
  }, [appState.withdrawals, updateUser]);

  const getReferralStats = useCallback(() => {
    if (!activeUser) return { totalReferrals: 0, activeReferrals: 0, totalEarnings: 0 };
    return {
        totalReferrals: activeUser.referrals.length,
        activeReferrals: activeUser.referrals.filter(r => r.status === "Active").length,
        totalEarnings: activeUser.referrals.reduce((sum, r) => sum + r.earnings, 0),
    }
  }, [activeUser]);

  const getTransactions = useCallback(() => {
      if (!activeUser) return [];
      const userDeposits = appState.deposits
          .filter(d => d.userId === activeUser.id)
          .map(d => ({ ...d, type: 'deposit' as const }));
      const userWithdrawals = appState.withdrawals
          .filter(w => w.userId === activeUser.id)
          .map(w => ({ ...w, type: 'withdrawal' as const }));

      return [...userDeposits, ...userWithdrawals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeUser, appState.deposits, appState.withdrawals]);

  const value: UserContextType = {
    isInitialized,
    user: activeUser,
    stats: activeUser?.stats || { roundsPlayed: 0, wins: 0, winRate: 0 },
    wallet: activeUser?.wallet || { balance: 0, totalDeposits: 0 },
    inventory: activeUser?.inventory || { reviveCount: 0, obstacleShieldCount: 0 },
    referrals: activeUser?.referrals || [],
    spend,
    deposit,
    withdraw,
    earn,
    addRevives,
    useRevive,
    addObstacleShield,
    useObstacleShield,
    recordGameResult,
    login,
    logout,
    signUp,
    getAllUsers,
    getAllDeposits,
    getAllWithdrawals,
    updateUserStatus,
    approveTransaction,
    rejectTransaction,
    getReferralStats,
    getTransactions,
    getQualifyingReferralsCount
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
