import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import "./WeeklyReviewPage.css";

const WeeklyReviewPage = () => {
  const { strategies } = useContext(DataContext);
  const [answers, setAnswers] = useState({
    threeLosses: "No",
    threeWins: "No",
    marketRegime: "Highway",
    removeOrAdd: "No",
  });
  const [autoDetected, setAutoDetected] = useState({
    anyThreeLosses: false,
    anyThreeWins: false,
    inactiveStrategies: [],
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Auto-detect from strategies
    const anyLoss = strategies.some((s) => s.consecutiveLosses >= 3);
    const anyWin = strategies.some((s) => s.consecutiveWins >= 3);
    const inactive = strategies.filter((s) => {
      if (!s.lastTradeDate) return false;
      return (new Date() - new Date(s.lastTradeDate)) / 86400000 > 30;
    });
    setAutoDetected({
      anyThreeLosses: anyLoss,
      anyThreeWins: anyWin,
      inactiveStrategies: inactive,
    });
  }, [strategies]);

  const handleChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitWeeklyReview(answers);
      setSubmitted(true);
    } catch (error) {
      console.error("Submit weekly review error", error);
    }
  };

  const marketRegimes = ["Highway", "Wave", "Sidewalk", "Washing Machine"];

  return (
    <div className="weekly-review-page">
      <h2>Weekly Review</h2>
      {submitted ? (
        <p>Weekly review submitted. Thank you!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="question">
            <p>Did any strategy get 3 consecutive losses this week?</p>
            <p>Auto-detected: {autoDetected.anyThreeLosses ? "Yes" : "No"}</p>
            <select name="threeLosses" value={answers.threeLosses} onChange={handleChange}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="question">
            <p>Did any strategy get 3 consecutive wins?</p>
            <p>Auto-detected: {autoDetected.anyThreeWins ? "Yes" : "No"}</p>
            <select name="threeWins" value={answers.threeWins} onChange={handleChange}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="question">
            <p>Has any strategy not traded in 30 days?</p>
            {autoDetected.inactiveStrategies.length > 0 ? (
              <ul>
                {autoDetected.inactiveStrategies.map((s) => (
                  <li key={s._id}>{s.name}</li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
          </div>

          <div className="question">
            <p>What was the market regime this week?</p>
            <select name="marketRegime" value={answers.marketRegime} onChange={handleChange}>
              {marketRegimes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="question">
            <p>Should any strategy be removed or added?</p>
            <select name="removeOrAdd" value={answers.removeOrAdd} onChange={handleChange}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <button type="submit">Submit Review</button>
        </form>
      )}
    </div>
  );
};

export default WeeklyReviewPage;