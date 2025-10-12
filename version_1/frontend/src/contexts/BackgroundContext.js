import { createContext, useContext, useState } from 'react';

const BackgroundContext = createContext();

export function BackgroundProvider({ children }) {
  const [showBackground, setShowBackground] = useState(true);

  const value = {
    showBackground,
    setShowBackground,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}