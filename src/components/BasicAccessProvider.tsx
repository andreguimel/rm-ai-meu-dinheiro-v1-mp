import React, { createContext, useContext } from "react";

interface BasicAccessContextType {
  isBasicAccess: boolean;
  showUpgradePrompt: () => void;
}

const BasicAccessContext = createContext<BasicAccessContextType | null>(null);

interface BasicAccessProviderProps {
  children: React.ReactNode;
  isBasicAccess: boolean;
  onShowUpgradePrompt: () => void;
}

export const BasicAccessProvider = ({
  children,
  isBasicAccess,
  onShowUpgradePrompt,
}: BasicAccessProviderProps) => {
  return (
    <BasicAccessContext.Provider
      value={{
        isBasicAccess,
        showUpgradePrompt: onShowUpgradePrompt,
      }}
    >
      {children}
    </BasicAccessContext.Provider>
  );
};

export const useBasicAccess = () => {
  const context = useContext(BasicAccessContext);
  if (!context) {
    return { isBasicAccess: false, showUpgradePrompt: () => {} };
  }
  return context;
};
