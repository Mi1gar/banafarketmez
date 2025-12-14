'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  username: string | null;
  setUsername: (username: string) => void;
  isUsernameSet: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USERNAME_STORAGE_KEY = 'banafarketmez_username';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    // LocalStorage'dan kullanıcı adını yükle
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
      if (storedUsername) {
        setUsernameState(storedUsername);
        setIsUsernameSet(true);
      }
    }
  }, []);

  const setUsername = (newUsername: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERNAME_STORAGE_KEY, newUsername);
      setUsernameState(newUsername);
      setIsUsernameSet(true);
    }
  };

  return (
    <UserContext.Provider value={{ username, setUsername, isUsernameSet }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

