import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import FOREX_PAIRS from "../../utils/pairs";
import "./RecordTradePage.css";

const RecordTradePage = () => {
  const { strategies, pairs, dailyBias, setDailyBias, refresh } =
    useContext(DataContext);

  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [form, setForm] = useState({
    pair: "",
    result: "Win",
    date: new Date().toISOString().split("T")[0],
    time: "08:00",
    tradeType: "Live",
    pauseOverride: false,
    followedBias: "Yes",
    note: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset pauseOverride when strategy changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, pauseOverride: false }));
  }, [selectedStrategy]);

  const strategyList = strategies || [];
  const selectedStrategyData = strategyList.find(
    (s) => s._id === selectedStrategy
  );

  // Use pairs from context if available, otherwise fall back to utility list
  const pairOptions = Array.isArray(pairs) && pairs.length > 0 ? pairs : FOREX_PAIRS;

  const handleSelect = (id) => {
    setSelectedStrategy(id);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (e) => {
    setForm((prev) => ({ ...prev, date: e.target.value }));
  };

  const handleTimeChange = (e) => {
    setForm((prev) => ({ ...prev, time: e.target.value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStrategy) return alert("Select a strategy first");

    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const uploadRes = await api.uploadImage(imageFile);
        imageUrl = uploadRes.data.imageUrl;
      }

      const tradeData = {
        strategyId: selectedStrategy,
        pair: form.pair,
        result: form.result,
        date: form.date,
        time: form.time,
        tradeType: form.tradeType,
        pauseOverride: form.pauseOverride,
        followedBias: form.followedBias,
        note: form.note,
        image: imageUrl,
      };

      await api.recordTrade(tradeData);
      alert("Trade recorded successfully");

      await refresh();

      setForm({
        pair: "",
        result: "Win",
        date: new Date().toISOString().split("T")[0],
        time: "08:00",
        tradeType: "Live",
        pauseOverride: false,
        followedBias: "Yes",
        note: "",
      });
      setImageFile(null);
    } catch (error) {
      console.error("Record trade error", error);
      alert(error.response?.data?.message || "Failed to record trade");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if selected strategy has 3 losses → show pause override checkbox
  const showPauseOverride =
    selectedStrategyData && selectedStrategyData.consecutiveLosses >= 3;

  const biasOptions = ["Bullish", "Bearish", "Neutral"];

  return (
    <div className="record-trade-page">
      <h2>Record Trade & Setup</h2>

      {/* Daily Bias Input */}
      <div className="daily-bias-section">
        <h3>Daily Bias</h3>
        {dailyBias ? (
          <p>
            Today's bias: <strong>{dailyBias}</strong>
          </p>
        ) : (
          <div>
            <select
              value={dailyBias || ""}
              onChange={(e) => setDailyBias(e.target.value)}
            >
              <option value="">-- Set Today's Bias --</option>
              {biasOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <button onClick={() => api.setDailyBias(dailyBias)}>
              Save Bias
            </button>
          </div>
        )}
      </div>

      {/* Strategy Carousel */}
      <div className="strategy-carousel">
        <h3>Select Strategy</h3>
        <div className="carousel">
          {strategyList.map((strategy) => (
            <div
              key={strategy._id}
              className={`strategy-card ${
                selectedStrategy === strategy._id ? "selected" : ""
              }`}
            >
              <img src={strategy.image} alt={strategy.name} />
              <h4>{strategy.name}</h4>
              <p>Type: {strategy.type}</p>
              {strategy.consecutiveLosses >= 3 && (
                <span className="flag red">⚠ Paused</span>
              )}
              <button onClick={() => handleSelect(strategy._id)}>
                Select
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Form */}
      {selectedStrategy && (
        <form className="trade-form" onSubmit={handleSubmit}>
          <h3>New Trade - {selectedStrategyData?.name}</h3>

          <div className="form-group">
            <label>Pair</label>
            <select
              name="pair"
              value={form.pair}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Pair --</option>
              {pairOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Result</label>
            <select name="result" value={form.result} onChange={handleChange}>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleDateChange}
            />
          </div>

          <div className="form-group">
            <label>Time (GMT)</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleTimeChange}
            />
          </div>

          <div className="form-group">
            <label>Trade Type</label>
            <select
              name="tradeType"
              value={form.tradeType}
              onChange={handleChange}
            >
              <option value="Live">Live</option>
              <option value="Demo">Demo</option>
              <option value="Forward Test">Forward Test</option>
            </select>
          </div>

          {/* Pause Override */}
          {showPauseOverride && (
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="pauseOverride"
                  checked={form.pauseOverride}
                  onChange={handleChange}
                />
                Override pause - I am forward testing this strategy only
              </label>
            </div>
          )}

          <div className="form-group">
            <label>Did trade follow daily bias?</label>
            <select
              name="followedBias"
              value={form.followedBias}
              onChange={handleChange}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="form-group">
            <label>Upload Trade Setup (Image)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <textarea name="note" value={form.note} onChange={handleChange} />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Trade"}
          </button>
        </form>
      )}
    </div>
  );
};

export default RecordTradePage;