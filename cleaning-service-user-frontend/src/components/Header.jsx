import React from 'react';
import { User, LogOut, Settings } from 'lucide-react';

function Header({ userName, onLogout, onProfileClick }) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"> 
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">PeoClean Cleaning Services</h1> 
        <div className="flex items-center space-x-6"> 
          
          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="flex items-center text-blue-100 text-sm md:text-base"
            aria-label="Open profile settings"
            title="Profile Settings"
          >
             <User className="mr-2 h-5 w-5" />
             <span className="hidden md:inline font-medium">{userName || 'Guest'}</span> 
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center text-blue-100 hover:text-red-300 transition duration-150 ease-in-out"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline ml-1 font-medium">Logout</span> 
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;