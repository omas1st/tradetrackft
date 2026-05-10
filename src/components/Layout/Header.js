import React from "react";
import { Link } from "react-router-dom";
import NotificationBanner from "./NotificationBanner";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <h1>Trading Journal</h1>
      <div className="header-right">
        <nav>
          <Link to="/">Home</Link>
        </nav>
        <div className="header-actions">
          <NotificationBanner />
        </div>
      </div>
    </header>
  );
};

export default Header;