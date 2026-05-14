// components/WeeklyReviewPage.js
import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import { startOfWeek, endOfWeek, format, subDays } from "date-fns";
import "./WeeklyReviewPage.css";

const WeeklyReviewPage = () => {
  const { strategies } = useContext(DataContext);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [period, setPeriod] = useState("week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDate, endDate;

        if (period === "week") {
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
        } else if (period === "3d") {
          startDate = subDays(now, 3);
          endDate = now;
        } else if (period === "7d") {
          startDate = subDays(now, 7);
          endDate = now;
        } else if (period === "30d") {
          startDate = subDays(now, 30);
          endDate = now;
        } else if (period === "60d") {
          startDate = subDays(now, 60);
          endDate = now;
        } else if (period === "100d") {
          startDate = subDays(now, 100);
          endDate = now;
        } else if (period === "365d") {
          startDate = subDays(now, 365);
          endDate = now;
        } else if (period === "custom") {
          if (!customStart || !customEnd) {
            setLoading(false);
            return;
          }
          startDate = new Date(customStart);
          endDate = new Date(customEnd);
        } else {
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
        }

        // Fetch trades for the selected period
        const { data: periodTrades } = await api.getTrades({
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        });

        // ---- Basic counts ----
        const totalTrades = periodTrades.length;
        const totalWins = periodTrades.filter((t) => t.result === "Win").length;
        const totalLosses = totalTrades - totalWins;

        // ---- Live trades only ----
        const liveTrades = periodTrades.filter((t) => t.tradeType === "Live");
        const totalLiveTrades = liveTrades.length;
        const totalLiveWins = liveTrades.filter((t) => t.result === "Win").length;
        const totalLiveLosses = totalLiveTrades - totalLiveWins;

        // ---- Pair statistics ----
        const pairStats = {};
        periodTrades.forEach((t) => {
          if (!pairStats[t.pair]) {
            pairStats[t.pair] = { wins: 0, losses: 0, total: 0 };
          }
          pairStats[t.pair].total++;
          if (t.result === "Win") pairStats[t.pair].wins++;
          else pairStats[t.pair].losses++;
        });

        const pairArray = Object.entries(pairStats).map(([pair, stats]) => ({
          pair,
          ...stats,
        }));

        const topWins = [...pairArray]
          .filter((p) => p.wins > 0)
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 3);
        const topLosses = [...pairArray]
          .filter((p) => p.losses > 0)
          .sort((a, b) => b.losses - a.losses)
          .slice(0, 3);
        const mostTraded = [...pairArray]
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);
        const leastTraded = [...pairArray]
          .filter((p) => p.total > 0)
          .sort((a, b) => a.total - b.total)
          .slice(0, 3);

        const mostTradedPair =
          pairArray.length > 0
            ? pairArray.sort((a, b) => b.total - a.total)[0].pair
            : "None";

        // ---- Strategy performance ----
        const stratStats = {};
        strategies.forEach((s) => {
          stratStats[s._id] = {
            name: s.name,
            currentTradeType: s.currentTradeType,
            trades: [],
            consecutiveLosses: s.consecutiveLosses,
            consecutiveWins: s.consecutiveWins,
            lastTradeDate: s.lastTradeDate,
          };
        });
        periodTrades.forEach((t) => {
          const sid = t.strategyId?._id || t.strategyId;
          if (sid && stratStats[sid]) {
            stratStats[sid].trades.push(t);
          }
        });

        const strategyPerformance = Object.values(stratStats).map((s) => {
          const wins = s.trades.filter((t) => t.result === "Win").length;
          const total = s.trades.length;
          const winRate = total ? ((wins / total) * 100).toFixed(1) : 0;
          return { ...s, wins, total, winRate: parseFloat(winRate) };
        });

        // ---- Original questions ----
        const anyThreeLosses = strategies.some((s) => s.consecutiveLosses >= 3);
        const anyThreeWins = strategies.some((s) => s.consecutiveWins >= 3);
        const thirtyDaysAgo = subDays(new Date(), 30);
        const inactiveStrategies = strategies.filter(
          (s) => !s.lastTradeDate || new Date(s.lastTradeDate) < thirtyDaysAgo
        );

        // ---- Best record ----
        let highRecordStrategy = null;
        const withTrades = strategyPerformance.filter((s) => s.total >= 2);
        if (withTrades.length > 0) {
          highRecordStrategy = withTrades.sort(
            (a, b) => b.winRate - a.winRate || b.wins - a.wins
          )[0];
        } else {
          const bestConsec = [...strategies].sort(
            (a, b) => b.consecutiveWins - a.consecutiveWins
          )[0];
          highRecordStrategy = {
            name: bestConsec?.name || "N/A",
            winRate: 0,
            wins: bestConsec?.consecutiveWins || 0,
            total: 0,
          };
        }

        // ---- ≥60% win rate ----
        const above60 = strategyPerformance.filter(
          (s) => s.total >= 2 && s.winRate >= 60
        );

        // ---- Live count ----
        const liveCount = strategies.filter(
          (s) => s.currentTradeType === "Live"
        ).length;
        const needMoreLive = liveCount < 3
          ? `Yes, you have ${liveCount} live strategy(ies). Aim for at least 3.`
          : "No, you have enough live strategies.";

        // ---- Removal candidates ----
        const removalCandidates = strategies
          .filter((s) => {
            if (s.consecutiveLosses >= 3) return true;
            const last10 = (strategyPerformance.find(
              (sp) => sp.name === s.name
            )?.trades || []).slice(-10);
            const winsLast10 = last10.filter((t) => t.result === "Win").length;
            const last10WinRate = last10.length
              ? (winsLast10 / last10.length) * 100
              : 100;
            if (last10.length >= 5 && last10WinRate < 30) return true;
            if (
              !s.lastTradeDate ||
              (new Date() - new Date(s.lastTradeDate)) / 86400000 > 30
            )
              return true;
            return false;
          })
          .map((s) => s.name);

        setWeeklyData({
          startDate: format(startDate, "dd MMM yyyy"),
          endDate: format(endDate, "dd MMM yyyy"),
          totalTrades,
          totalWins,
          totalLosses,
          totalLiveTrades,
          totalLiveWins,
          totalLiveLosses,
          mostTradedPair,
          topWins,
          topLosses,
          mostTradedPairs: mostTraded,
          leastTradedPairs: leastTraded,
          anyThreeLosses,
          anyThreeWins,
          inactiveStrategies: inactiveStrategies.map((s) => s.name),
          highRecordStrategy,
          above60,
          needMoreLive,
          removalCandidates,
          liveCount,
        });
      } catch (error) {
        console.error("Failed to load weekly review data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [period, customStart, customEnd, strategies]);

  if (loading) return <div className="weekly-review-page"><p>Loading review...</p></div>;
  if (!weeklyData) return <div className="weekly-review-page"><p>Could not load review data.</p></div>;

  const {
    startDate,
    endDate,
    totalTrades,
    totalWins,
    totalLosses,
    totalLiveTrades,
    totalLiveWins,
    totalLiveLosses,
    mostTradedPair,
    topWins,
    topLosses,
    mostTradedPairs,
    leastTradedPairs,
    anyThreeLosses,
    anyThreeWins,
    inactiveStrategies,
    highRecordStrategy,
    above60,
    needMoreLive,
    removalCandidates,
    liveCount,
  } = weeklyData;

  return (
    <div className="weekly-review-page">
      <h2>Weekly Review (Auto‑Detected)</h2>

      {/* Period filter */}
      <div className="period-filter">
        <label>
          Period:
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">This Week</option>
            <option value="3d">Last 3 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="60d">Last 60 Days</option>
            <option value="100d">Last 100 Days</option>
            <option value="365d">Last 365 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </label>
        {period === "custom" && (
          <div className="custom-dates">
            <label>
              Start:
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </label>
            <label>
              End:
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </label>
          </div>
        )}
        <p className="date-range">
          {startDate} — {endDate}
        </p>
      </div>

      {/* Original Checks */}
      <section className="stat-block">
        <h3>Original Checks</h3>
        <p><strong>Did any strategy get 3 consecutive losses?</strong> {anyThreeLosses ? "Yes" : "No"}</p>
        <p><strong>Did any strategy get 3 consecutive wins?</strong> {anyThreeWins ? "Yes" : "No"}</p>
        <p><strong>Has any strategy not traded in 30 days?</strong>{" "}
          {inactiveStrategies.length > 0 ? `Yes: ${inactiveStrategies.join(", ")}` : "None"}
        </p>
      </section>

      {/* Trading Activity */}
      <section className="stat-block">
        <h3>Trading Activity</h3>
        <p><strong>Total Trades:</strong> {totalTrades}</p>
        <p><strong>Total Wins:</strong> {totalWins}</p>
        <p><strong>Total Losses:</strong> {totalLosses}</p>
        <p><strong>Total Live Trades:</strong> {totalLiveTrades}</p>
        <p><strong>Total Live Wins:</strong> {totalLiveWins}</p>
        <p><strong>Total Live Losses:</strong> {totalLiveLosses}</p>
        <p><strong>Most Traded Pair:</strong> {mostTradedPair}</p>
      </section>

      {/* Top 3 Pairs */}
      <section className="stat-block">
        <h3>Top 3 Pairs</h3>
        <div className="pair-grid">
          <div>
            <h4>Most Wins</h4>
            <ul>
              {topWins.length > 0 ? topWins.map((p, i) => (
                <li key={i}>{p.pair} — {p.wins} wins</li>
              )) : <li>None</li>}
            </ul>
          </div>
          <div>
            <h4>Most Losses</h4>
            <ul>
              {topLosses.length > 0 ? topLosses.map((p, i) => (
                <li key={i}>{p.pair} — {p.losses} losses</li>
              )) : <li>None</li>}
            </ul>
          </div>
          <div>
            <h4>Most Traded</h4>
            <ul>
              {mostTradedPairs.length > 0 ? mostTradedPairs.map((p, i) => (
                <li key={i}>{p.pair} — {p.total} trades</li>
              )) : <li>None</li>}
            </ul>
          </div>
          <div>
            <h4>Least Traded</h4>
            <ul>
              {leastTradedPairs.length > 0 ? leastTradedPairs.map((p, i) => (
                <li key={i}>{p.pair} — {p.total} trades</li>
              )) : <li>None</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* Strategy Performance */}
      <section className="stat-block">
        <h3>Strategy Performance</h3>
        <p><strong>Highest Record:</strong> {highRecordStrategy.name} — {highRecordStrategy.wins} wins / {highRecordStrategy.total} trades ({highRecordStrategy.winRate}%)</p>
        <div>
          <strong>Strategies with ≥60% Win Rate (min 2 trades):</strong>
          {above60.length > 0 ? (
            <ul>
              {above60.map((s) => (
                <li key={s.name}>{s.name} — {s.winRate}% ({s.wins}/{s.total})</li>
              ))}
            </ul>
          ) : <p>None</p>}
        </div>
      </section>

      {/* Health Checks */}
      <section className="stat-block">
        <h3>Health Checks</h3>
        <p><strong>Do you need more live strategies?</strong> {needMoreLive}{liveCount < 3 && <span className="warning"> (Active live: {liveCount})</span>}</p>
        <div>
          <strong>Do you need to remove any strategy?</strong>{" "}
          {removalCandidates.length > 0 ? (
            <>Yes, consider reviewing: <strong>{removalCandidates.join(", ")}</strong></>
          ) : "No, all strategies look healthy."}
        </div>
      </section>
    </div>
  );
};

export default WeeklyReviewPage;