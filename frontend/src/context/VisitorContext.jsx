import { createContext, useContext, useState } from 'react';

const VisitorContext = createContext({ activeCount: 0, setActiveCount: () => {} });

export function VisitorProvider({ children }) {
  const [activeCount, setActiveCount] = useState(0);
  return (
    <VisitorContext.Provider value={{ activeCount, setActiveCount }}>
      {children}
    </VisitorContext.Provider>
  );
}

export const useVisitorContext = () => useContext(VisitorContext);
