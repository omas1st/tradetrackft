import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  const buttons = [
    { label: "Record Trade and Setups", path: "/record-trade" },
    { label: "Edit Strategies", path: "/edit-strategy" },
    { label: "Analysis Preview", path: "/analysis-preview" },
    { label: "Analysis Decision", path: "/analysis-decision" },
    { label: "Past Trades", path: "/past-trades" },
    { label: "Weekly Review", path: "/weekly-review" },
  ];

  return (
    <div className="home-page">
      <h2>Dashboard</h2>
      <div className="button-grid">
        {buttons.map((btn, idx) => (
          <button key={idx} onClick={() => navigate(btn.path)}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;