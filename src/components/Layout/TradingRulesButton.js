import React, { useState, useRef, useEffect } from "react";
import "./TradingRulesButton.css";

const TradingRulesButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="trading-rules-banner" ref={ref}>
      <button
        className="rules-icon-btn"
        onClick={() => setOpen(!open)}
        title="Trading Rules"
      >
        📋
      </button>
      {open && (
        <div className="rules-dropdown">
          <h4>Trading Rules</h4>
          <ol>
            <li>Trade only the live strategy on live account.</li>
            <li>Forward test trades to know the weakness of the strategy.</li>
            <li>Don't trade forward test or demo in a live market.</li>
            <li>Don't overtrade, maximum of 3 setups per day.</li>
            <li>Don't Over risk, Risk maximum of 5% per trade.</li>
            <li>Record all the trades setups you see for the day and monitor the market for all the trade type.</li>
            <li>Trade only from 07:00 am to 06:00 pm.</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default TradingRulesButton;