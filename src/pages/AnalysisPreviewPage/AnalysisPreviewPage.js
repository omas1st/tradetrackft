import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import "./AnalysisPreviewPage.css";

const AnalysisPreviewPage = () => {
  const { strategies } = useContext(DataContext);
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [filter, setFilter] = useState("last10"); // 'last3','last7','last10','last20','last50','last100','3d','7d','30d','60d','365d'
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedStrategy) return;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const { data } = await api.getAnalysisPreview({
          strategyId: selectedStrategy,
          filter,
        });
        setPreviewData(data);
      } catch (error) {
        console.error("Analysis preview error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [selectedStrategy, filter]);

  const strategyOptions = strategies || [];

  return (
    <div className="analysis-preview-page">
      <h2>Analysis Preview</h2>

      {/* Streak Alerts */}
      {strategies.map((s) => {
        if (s.consecutiveLosses >= 3) {
          return (
            <div key={s._id} className="alert red">
              ⚠️ {s.name}: {s.consecutiveLosses} CONSECUTIVE LOSSES (PAUSED UNTIL 3 DEMO WINS)
            </div>
          );
        }
        if (s.consecutiveWins >= 2) {
          return (
            <div key={s._id} className="alert green">
              ✅ {s.name}: {s.consecutiveWins} CONSECUTIVE WINS (ACTIVE)
            </div>
          );
        }
        return null;
      })}

      <div className="controls">
        <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
          <option value="">-- Select Strategy --</option>
          {strategyOptions.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="last3">Last 3 results</option>
          <option value="last7">Last 7 results</option>
          <option value="last10">Last 10 results</option>
          <option value="last20">Last 20 results</option>
          <option value="last50">Last 50 results</option>
          <option value="last100">Last 100 results</option>
          <option value="3d">Last 3 days</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="60d">Last 60 days</option>
          <option value="365d">Last 365 days</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}

      {previewData && (
        <div className="preview-results">
          <h3>{previewData.strategyName}</h3>
          <p>Result sequence: {previewData.resultString}</p>
          <p>Consecutive Win/Loss: {previewData.streak}</p>
          <p>Status: {previewData.active ? "Active" : "Not Active"}</p>

          <h4>Expected vs Actual</h4>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Expected Win Rate</th>
                <th>Actual Win Rate</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{filter}</td>
                <td>50%</td>
                <td>{previewData.actualWinRate}%</td>
                <td style={{ color: previewData.difference >= 0 ? "green" : "red" }}>
                  {previewData.difference >= 0 ? "+" : ""}
                  {previewData.difference}%
                </td>
              </tr>
            </tbody>
          </table>

          {previewData.trades && previewData.trades.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Result</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {previewData.trades.map((trade, idx) => (
                  <tr key={idx}>
                    <td>{new Date(trade.date).toLocaleDateString()}</td>
                    <td>{trade.pair}</td>
                    <td>{trade.result === "Win" ? "W" : "L"}</td>
                    <td>{trade.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPreviewPage;