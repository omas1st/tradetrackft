import React, { useState, useEffect } from "react";
import * as api from "../../services/api";
import "./AnalysisDecisionPage.css";

const AnalysisDecisionPage = () => {
  const [period, setPeriod] = useState("7d"); // 1d,3d,7d,30d,custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [simulationMode, setSimulationMode] = useState(false);
  const [decisionData, setDecisionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDecision = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (period === "custom") {
        params.start = customStart;
        params.end = customEnd;
      }
      if (simulationMode) params.simulate = true;
      const { data } = await api.getAnalysisDecision(params);
      setDecisionData(data);
    } catch (error) {
      console.error("Decision analysis error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecision();
    // eslint-disable-next-line
  }, [period, customStart, customEnd, simulationMode]);

  const toggleSimulation = () => setSimulationMode(!simulationMode);

  return (
    <div className="analysis-decision-page">
      <h2>Analysis Decision</h2>

      <div className="filters">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="1d">1 Day</option>
          <option value="3d">3 Days</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="custom">Custom</option>
        </select>
        {period === "custom" && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
        <label>
          <input type="checkbox" checked={simulationMode} onChange={toggleSimulation} />
          Simulate 3:1 Risk-Reward
        </label>
      </div>

      {loading && <p>Loading...</p>}

      {decisionData && (
        <div className="dashboard">
          {/* Top 3 Win pairs per strategy type */}
          <section>
            <h3>Top 3 Pairs (Win Rate) by Strategy Type</h3>
            {Object.entries(decisionData.topWinsByType).map(([type, pairs]) => (
              <div key={type}>
                <h4>{type}</h4>
                <ul>
                  {pairs.map((p, i) => (
                    <li key={i}>{p.pair}: {p.winRate}%</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Top 3 Loss pairs */}
          <section>
            <h3>Top 3 Pairs (Loss Rate) by Strategy Type</h3>
            {Object.entries(decisionData.topLossesByType).map(([type, pairs]) => (
              <div key={type}>
                <h4>{type}</h4>
                <ul>
                  {pairs.map((p, i) => (
                    <li key={i}>{p.pair}: {p.lossRate}%</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Active/Inactive Strategies */}
          <section>
            <h3>Strategy Status</h3>
            <h4>Active</h4>
            <ul>
              {decisionData.activeStrategies.map((s) => (
                <li key={s._id}>{s.name}</li>
              ))}
            </ul>
            <h4>Inactive (no trade 30d)</h4>
            <ul>
              {decisionData.inactiveStrategies.map((s) => (
                <li key={s._id}>{s.name}</li>
              ))}
            </ul>
          </section>

          {/* Inactive Pairs (not traded 30d) */}
          <section>
            <h3>Pairs not traded in 30 days</h3>
            <ul>
              {decisionData.inactivePairs.map((pair) => (
                <li key={pair}>{pair}</li>
              ))}
            </ul>
          </section>

          {/* Streaks with flags */}
          <section>
            <h3>Consecutive Wins/Losses</h3>
            {decisionData.streaks.map((s) => (
              <div key={s.strategyId} className={s.consecutiveLosses >= 3 ? "red-flag" : "green-flag"}>
                {s.strategyName}: {s.consecutiveWins}W / {s.consecutiveLosses}L
                {s.consecutiveLosses >= 3 ? " (PAUSED)" : ""}
              </div>
            ))}
          </section>

          {/* Total P&L */}
          <section>
            <h3>Total for Period ({period})</h3>
            <p>Total Wins: {decisionData.totalWins}</p>
            <p>Total Losses: {decisionData.totalLosses}</p>
            {simulationMode ? (
              <p>P&L (3R win, 1R loss): {decisionData.simulatedPnL}R</p>
            ) : (
              <p>Raw count (Win = +1, Loss = -1): {decisionData.rawPnL}</p>
            )}
          </section>

          {/* Best Time of Day per Strategy */}
          <section>
            <h3>Best Time of Day</h3>
            {decisionData.bestTimes.map((bt) => (
              <div key={bt.strategyId}>
                <strong>{bt.strategyName}</strong>: Best {bt.bestWindow} ({bt.bestWinRate}%), worst after {bt.worstTime} ({bt.worstWinRate}%)
              </div>
            ))}
          </section>

          {/* Daily Bias Compliance */}
          <section>
            <h3>Daily Bias Compliance</h3>
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Trades following bias</th>
                  <th>Win rate following bias</th>
                  <th>Trades against bias</th>
                  <th>Win rate against bias</th>
                </tr>
              </thead>
              <tbody>
                {decisionData.biasCompliance.map((bc) => (
                  <tr key={bc.strategyId}>
                    <td>{bc.strategyName}</td>
                    <td>{bc.followCount}</td>
                    <td>{bc.followWinRate}%</td>
                    <td>{bc.againstCount}</td>
                    <td>{bc.againstWinRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Next Trade Suggestion */}
          <section className="suggestion">
            <h3>Next Trade Suggestion</h3>
            <p>{decisionData.suggestion}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default AnalysisDecisionPage;