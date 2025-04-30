import React from "react";

// Optional Layout component for consistent page structure and padding
const Layout = ({ children }) => {
  return (
    <div className="container mx-auto p-4">
      {/* The content of the page will be rendered here */}
      {children}
    </div>
  );
};

export default Layout;
