import React from 'react';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
  const baseClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-brand-secondary";
  const activeClasses = "bg-brand-primary text-white";
  const inactiveClasses = "text-gray-600 hover:bg-gray-200 hover:text-brand-primary";
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};