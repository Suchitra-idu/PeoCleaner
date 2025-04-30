import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8"> 
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-center md:text-left"> 
            <h3 className="text-lg font-semibold text-white mb-1">PeoClean Cleaning Services</h3> 
            <p className="text-gray-400 text-sm">Professional cleaning services for your home and office</p> 
          </div>
          <div className="text-sm text-gray-400 text-center md:text-right">
            &copy; {new Date().getFullYear()} PeoClean. All rights reserved. 
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;