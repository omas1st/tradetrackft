import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import "./PastTradesPage.css";

const PastTradesPage = () => {
  const { strategies } = useContext(DataContext);
  const [view, setView] = useState("folders");
  const [strategyTrades, setStrategyTrades] = useState({});
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);

  // sort strategies by trade type (Live > Forward Test > Demo) then by name
  const tradeTypeOrder = { "Live": 0, "Forward Test": 1, "Demo": 2 };
  const sortedStrategies = [...(strategies || [])].sort((a, b) => {
    const aOrder = tradeTypeOrder[a.currentTradeType] ?? 3;
    const bOrder = tradeTypeOrder[b.currentTradeType] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.name || "").localeCompare(b.name || "");
  });

  useEffect(() => {
    if (view !== "folders") return;
    const fetchAllTrades = async () => {
      setLoading(true);
      const tradesMap = {};
      for (const s of sortedStrategies) {
        try {
          const { data } = await api.getTrades({ strategyId: s._id });
          tradesMap[s._id] = data;
        } catch (error) {
          console.error(`Failed to fetch trades for ${s.name}`, error);
        }
      }
      setStrategyTrades(tradesMap);
      setLoading(false);
    };
    fetchAllTrades();
  }, [sortedStrategies, view]);

  const handleCompare = async () => {
    if (compareIds.length < 2) return alert("Select at least 2 strategies to compare");
    setLoading(true);
    try {
      const { data } = await api.getAnalysisDecision({
        period: "30d",
        simulate: false,
        compareIds: compareIds.join(","),
      });
      setCompareData(data);
    } catch (error) {
      console.error("Compare error", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareSelection = (id) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="past-trades-page">
      <h2>Past Trades</h2>
      <div className="view-toggle">
        <button onClick={() => setView("folders")} className={view === "folders" ? "active" : ""}>
          Folders
        </button>
        <button onClick={() => setView("compare")} className={view === "compare" ? "active" : ""}>
          Compare Strategies
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {view === "folders" && (
        <div className="folders">
          {sortedStrategies.map((strat) => {
            const trades = strategyTrades[strat._id] || [];
            return (
              <div key={strat._id} className="folder">
                <h3>
                  {strat.name} <span className="trade-type-badge">{strat.currentTradeType}</span>
                </h3>
                <div className="image-scroll-row">
                  {trades
                    .filter((t) => t.image)
                    .map((t, idx) => (
                      <img key={idx} src={t.image} alt="trade setup" className="scroll-image" />
                    ))}
                </div>
                <div className="actions">
                  <a href={`/api/trades/export/csv?strategyId=${strat._id}`}>Export CSV</a>
                  <a href={`/api/trades/export/zip?strategyId=${strat._id}`}>Download ZIP</a>
                  <a href={`/api/trades/export/pdf?strategyId=${strat._id}`}>Generate PDF</a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "compare" && (
        <div className="compare-view">
          <h3>Select Strategies to Compare</h3>
          <div className="strategy-checkboxes">
            {strategies.map((s) => (
              <label key={s._id}>
                <input
                  type="checkbox"
                  checked={compareIds.includes(s._id)}
                  onChange={() => toggleCompareSelection(s._id)}
                />
                {s.name}
              </label>
            ))}
          </div>
          <button onClick={handleCompare}>Compare</button>

          {compareData && (
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareData.strategies.map((s) => (
                    <th key={s._id}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Trades (30d)</td>
                  {compareData.strategies.map((s) => (
                    <td key={s._id}>{s.totalTrades}</td>
                  ))}
                </tr>
                <tr>
                  <td>Win Rate</td>
                  {compareData.strategies.map((s) => (
                    <td key={s._id}>{s.winRate}%</td>
                  ))}
                </tr>
                <tr>
                  <td>Consecutive Wins</td>
                  {compareData.strategies.map((s) => (
                    <td key={s._id}>{s.consecutiveWins}</td>
                  ))}
                </tr>
                <tr>
                  <td>Status / Trade Type</td>
                  {compareData.strategies.map((s) => (
                    <td key={s._id}>{s.active ? "Active" : "Paused"} ({s.tradeType})</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PastTradesPage;