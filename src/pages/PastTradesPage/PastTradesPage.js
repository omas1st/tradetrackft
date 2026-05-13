import React, { useState, useContext, useEffect, useMemo } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import "./PastTradesPage.css";

const API_BASE = process.env.REACT_APP_API_URL;

const tradeTypeOrder = { Live: 0, "Forward Test": 1, Demo: 2 };

const PastTradesPage = () => {
  const { strategies } = useContext(DataContext);
  const [view, setView] = useState("folders");
  const [strategyTrades, setStrategyTrades] = useState({});
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compare period state
  const [comparePeriod, setComparePeriod] = useState("30d");
  const [compareStart, setCompareStart] = useState("");
  const [compareEnd, setCompareEnd] = useState("");

  // Editing state
  const [editTradeId, setEditTradeId] = useState(null);
  const [editForm, setEditForm] = useState({
    pair: "",
    result: "Win",
    date: "",
    time: "08:00",
    tradeType: "Live",
    note: "",
    existingStrategyId: null,
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editError, setEditError] = useState("");

  // Which strategies' trade lists are visible
  const [visibleTrades, setVisibleTrades] = useState({});

  const sortedStrategies = useMemo(() => {
    if (!strategies || strategies.length === 0) return [];
    return [...strategies].sort((a, b) => {
      const aOrder = tradeTypeOrder[a.currentTradeType] ?? 3;
      const bOrder = tradeTypeOrder[b.currentTradeType] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [strategies]);

  // Fetch trades in folders view
  useEffect(() => {
    if (view !== "folders") return;
    if (!sortedStrategies || sortedStrategies.length === 0) return;

    const fetchAllTrades = async () => {
      setLoading(true);
      try {
        const promises = sortedStrategies.map(async (s) => {
          try {
            const { data } = await api.getTrades({ strategyId: s._id });
            return { id: s._id, data };
          } catch (error) {
            console.error(`Failed fetching trades for ${s.name}`, error);
            return { id: s._id, data: [] };
          }
        });
        const results = await Promise.all(promises);
        const tradesMap = {};
        results.forEach(({ id, data }) => {
          tradesMap[id] = data;
        });
        setStrategyTrades(tradesMap);
      } catch (err) {
        console.error("Unexpected error during trade fetch", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTrades();
  }, [sortedStrategies, view]);

  // Toggle visibility of a strategy's trade list
  const toggleTradeList = (strategyId) => {
    setVisibleTrades((prev) => ({
      ...prev,
      [strategyId]: !prev[strategyId],
    }));
  };

  // ---- Edit handlers ----
  const startEdit = (trade, strategyId) => {
    setEditTradeId(trade._id);
    setEditForm({
      pair: trade.pair || "",
      result: trade.result || "Win",
      date: trade.date?.slice(0, 10) || "",
      time: trade.time || "08:00",
      tradeType: trade.tradeType || "Live",
      note: trade.note || "",
      existingStrategyId: strategyId,
    });
    setEditImageFile(null);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditTradeId(null);
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFileChange = (e) => {
    setEditImageFile(e.target.files[0] || null);
  };

  const submitEdit = async () => {
    if (!editTradeId || !editForm.existingStrategyId) return;
    setEditError("");
    try {
      const formData = new FormData();
      formData.append("pair", editForm.pair);
      formData.append("result", editForm.result);
      formData.append("date", editForm.date);
      formData.append("time", editForm.time);
      formData.append("tradeType", editForm.tradeType);
      formData.append("note", editForm.note);
      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      await api.updateTrade(editTradeId, formData);
      alert("Trade updated successfully");

      const updatedMap = { ...strategyTrades };
      const { data } = await api.getTrades({ strategyId: editForm.existingStrategyId });
      updatedMap[editForm.existingStrategyId] = data;
      setStrategyTrades(updatedMap);
      setEditTradeId(null);
    } catch (error) {
      console.error("Update trade error:", error);
      setEditError(error.response?.data?.message || "Failed to update trade");
    }
  };

  const handleDelete = async (tradeId, strategyId) => {
    if (!window.confirm("Delete this trade? This cannot be undone.")) return;
    try {
      await api.deleteTrade(tradeId);
      alert("Trade deleted");
      const { data } = await api.getTrades({ strategyId });
      setStrategyTrades((prev) => ({ ...prev, [strategyId]: data }));
    } catch (error) {
      console.error("Delete trade error:", error);
      alert("Failed to delete trade");
    }
  };

  // ---- Compare logic with period filter ----
  const handleCompare = async () => {
    if (compareIds.length < 2) return alert("Select at least 2 strategies");
    setLoading(true);
    try {
      const params = {
        period: comparePeriod,
        simulate: false,
        compareIds: compareIds.join(","),
      };
      if (comparePeriod === "custom") {
        if (!compareStart || !compareEnd)
          return alert("Please select start and end dates for custom period.");
        params.start = compareStart;
        params.end = compareEnd;
      }
      const { data } = await api.getAnalysisDecision(params);
      setCompareData(data);
    } catch (error) {
      console.error("Compare error", error);
      alert("Failed to compare strategies");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareSelection = (id) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Metric definitions for the row‑wise compare table (includes new per-type rows)
  const compareMetrics = [
    { label: "Trade Type", key: "tradeType" },
    { label: "Total Trades", key: "totalTrades" },
    { label: "Wins", key: "wins" },
    { label: "Losses", key: "losses" },
    { label: "Win Rate", key: "winRate", suffix: "%" },
    { label: "Loss Rate", key: "lossRate", suffix: "%" },
    { label: "Consec. Wins", key: "consecutiveWins" },
    { label: "Last Trade", key: "lastTradeDaysAgo", fallback: "Never", suffix: " days ago" },
    // ---- New per-type rows ----
    { label: "Live Trades (Total)", key: "liveTotal" },
    { label: "Live Wins", key: "liveWins" },
    { label: "Live Losses", key: "liveLosses" },
    { label: "Fwd Test Trades (Total)", key: "forwardTestTotal" },
    { label: "Fwd Test Wins", key: "forwardTestWins" },
    { label: "Fwd Test Losses", key: "forwardTestLosses" },
    { label: "Demo Trades (Total)", key: "demoTotal" },
    { label: "Demo Wins", key: "demoWins" },
    { label: "Demo Losses", key: "demoLosses" },
  ];

  // Helper to format metric value
  const formatMetricValue = (s, metric) => {
    let val = s[metric.key];
    if (val === undefined || val === null) {
      return metric.fallback || "0";
    }
    if (metric.key === "lastTradeDaysAgo") {
      return val !== null ? `${val} days ago` : "Never";
    }
    if (metric.suffix) {
      return `${val}${metric.suffix}`;
    }
    return val;
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
            const listVisible = visibleTrades[strat._id] || false;

            return (
              <div key={strat._id} className="folder">
                <h3>
                  {strat.name}{" "}
                  <span className="trade-type-badge">{strat.currentTradeType}</span>
                </h3>

                <div className="image-scroll-row">
                  {trades
                    .filter((t) => t.image)
                    .map((t, idx) => (
                      <img
                        key={idx}
                        src={t.image}
                        alt={`trade ${idx}`}
                        className="scroll-image"
                      />
                    ))}
                  {trades.filter((t) => t.image).length === 0 && (
                    <p className="no-images">No images yet</p>
                  )}
                </div>

                <button
                  className="toggle-trades-btn"
                  onClick={() => toggleTradeList(strat._id)}
                >
                  {listVisible ? "Hide Trades" : "Show Trades"} ({trades.length})
                </button>

                {listVisible && (
                  <div className="trades-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Pair</th>
                          <th>Result</th>
                          <th>Note</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade) => (
                          <tr key={trade._id}>
                            <td>{new Date(trade.date).toLocaleDateString()}</td>
                            <td>{trade.pair}</td>
                            <td className={`result-${trade.result.toLowerCase()}`}>
                              {trade.result}
                            </td>
                            <td>{trade.note || "-"}</td>
                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => startEdit(trade, strat._id)}
                              >
                                ✏️
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(trade._id, strat._id)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="actions">
                  <a href={`${API_BASE}/trades/export/csv?strategyId=${strat._id}`}>Export CSV</a>
                  <a href={`${API_BASE}/trades/export/zip?strategyId=${strat._id}`}>Download ZIP</a>
                  <a href={`${API_BASE}/trades/export/pdf?strategyId=${strat._id}`}>Generate PDF</a>
                </div>

                {/* Edit Modal */}
                {editTradeId && editForm.existingStrategyId === strat._id && (
                  <div className="edit-trade-overlay" onClick={cancelEdit}>
                    <div
                      className="edit-trade-form"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4>Edit Trade</h4>
                      {editError && <div className="error-message">{editError}</div>}
                      <label>
                        Pair:
                        <input
                          type="text"
                          name="pair"
                          value={editForm.pair}
                          onChange={handleEditChange}
                        />
                      </label>
                      <label>
                        Result:
                        <select
                          name="result"
                          value={editForm.result}
                          onChange={handleEditChange}
                        >
                          <option value="Win">Win</option>
                          <option value="Loss">Loss</option>
                        </select>
                      </label>
                      <label>
                        Date:
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                        />
                      </label>
                      <label>
                        Time:
                        <input
                          type="time"
                          name="time"
                          value={editForm.time}
                          onChange={handleEditChange}
                        />
                      </label>
                      <label>
                        Trade Type:
                        <select
                          name="tradeType"
                          value={editForm.tradeType}
                          onChange={handleEditChange}
                        >
                          <option value="Live">Live</option>
                          <option value="Demo">Demo</option>
                          <option value="Forward Test">Forward Test</option>
                        </select>
                      </label>
                      <label>
                        Note:
                        <textarea
                          name="note"
                          value={editForm.note}
                          onChange={handleEditChange}
                          rows={2}
                        />
                      </label>
                      <label>
                        Change Image (optional):
                        <input type="file" accept="image/*" onChange={handleEditFileChange} />
                      </label>
                      <div className="form-buttons">
                        <button onClick={submitEdit}>Save Changes</button>
                        <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Period filter */}
          <div className="compare-period-filter">
            <label>
              Period:
              <select
                value={comparePeriod}
                onChange={(e) => setComparePeriod(e.target.value)}
              >
                <option value="3d">Last 3 Days</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="60d">Last 60 Days</option>
                <option value="100d">Last 100 Days</option>
                <option value="365d">Last 365 Days</option>
                <option value="custom">Custom Range</option>
                <option value="">All Time</option>
              </select>
            </label>
            {comparePeriod === "custom" && (
              <div className="custom-dates">
                <label>
                  Start:
                  <input
                    type="date"
                    value={compareStart}
                    onChange={(e) => setCompareStart(e.target.value)}
                  />
                </label>
                <label>
                  End:
                  <input
                    type="date"
                    value={compareEnd}
                    onChange={(e) => setCompareEnd(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          <button onClick={handleCompare}>Compare</button>

          {compareData && (
            <div className="compare-results">
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
                  {compareMetrics.map((metric) => (
                    <tr key={metric.label}>
                      <td>{metric.label}</td>
                      {compareData.strategies.map((s) => (
                        <td key={s._id}>
                          {formatMetricValue(s, metric)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastTradesPage;