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

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday

        // Fetch all trades for this week
        const { data: weekTrades } = await api.getTrades({
          startDate: format(weekStart, "yyyy-MM-dd"),
          endDate: format(weekEnd, "yyyy-MM-dd"),
        });

        // ---- Basic counts ----
        const totalTrades = weekTrades.length;
        const totalWins = weekTrades.filter((t) => t.result === "Win").length;
        const totalLosses = totalTrades - totalWins;

        // ---- Most traded pair ----
        const pairCount = {};
        weekTrades.forEach((t) => {
          pairCount[t.pair] = (pairCount[t.pair] || 0) + 1;
        });
        const mostTradedPair =
          Object.keys(pairCount).length > 0
            ? Object.entries(pairCount).sort((a, b) => b[1] - a[1])[0][0]
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
        weekTrades.forEach((t) => {
          if (stratStats[t.strategyId?._id || t.strategyId]) {
            stratStats[t.strategyId?._id || t.strategyId].trades.push(t);
          }
        });

        const strategyPerformance = Object.values(stratStats).map((s) => {
          const wins = s.trades.filter((t) => t.result === "Win").length;
          const total = s.trades.length;
          const winRate = total ? ((wins / total) * 100).toFixed(1) : 0;
          return { ...s, wins, total, winRate: parseFloat(winRate) };
        });

        // ---- ORIGINAL QUESTIONS ----
        const anyThreeLosses = strategies.some((s) => s.consecutiveLosses >= 3);
        const anyThreeWins = strategies.some((s) => s.consecutiveWins >= 3);

        // Inactive (>30 days)
        const thirtyDaysAgo = subDays(now, 30);
        const inactiveStrategies = strategies.filter(
          (s) => !s.lastTradeDate || new Date(s.lastTradeDate) < thirtyDaysAgo
        );

        // ---- ADDITIONAL QUESTIONS ----
        // Strategy with highest record this week
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

        const above60 = strategyPerformance.filter(
          (s) => s.total >= 2 && s.winRate >= 60
        );

        const liveCount = strategies.filter(
          (s) => s.currentTradeType === "Live"
        ).length;
        const needMoreLive = liveCount < 3
          ? `Yes, you have ${liveCount} live strategy(ies). Aim for at least 3.`
          : "No, you have enough live strategies.";

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
          weekStart: format(weekStart, "dd MMM yyyy"),
          weekEnd: format(weekEnd, "dd MMM yyyy"),
          totalTrades,
          totalWins,
          totalLosses,
          mostTradedPair,
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
  }, [strategies]);

  if (loading) return <div className="weekly-review-page"><p>Loading weekly review...</p></div>;
  if (!weeklyData) return <div className="weekly-review-page"><p>Could not load review data.</p></div>;

  const {
    weekStart,
    weekEnd,
    totalTrades,
    totalWins,
    totalLosses,
    mostTradedPair,
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
      <p className="date-range">
        {weekStart} — {weekEnd}
      </p>

      <section className="stat-block">
        <h3>Original Checks</h3>
        <p>
          <strong>Did any strategy get 3 consecutive losses?</strong>{" "}
          {anyThreeLosses ? "Yes" : "No"}
        </p>
        <p>
          <strong>Did any strategy get 3 consecutive wins?</strong>{" "}
          {anyThreeWins ? "Yes" : "No"}
        </p>
        <p>
          <strong>Has any strategy not traded in 30 days?</strong>{" "}
          {inactiveStrategies.length > 0
            ? `Yes: ${inactiveStrategies.join(", ")}`
            : "None"}
        </p>
      </section>

      <section className="stat-block">
        <h3>Trading Activity</h3>
        <p><strong>Total Trades This Week:</strong> {totalTrades}</p>
        <p><strong>Total Wins:</strong> {totalWins}</p>
        <p><strong>Total Losses:</strong> {totalLosses}</p>
        <p><strong>Most Traded Pair:</strong> {mostTradedPair}</p>
      </section>

      <section className="stat-block">
        <h3>Strategy Performance</h3>
        <p>
          <strong>Highest Record This Week:</strong>{" "}
          {highRecordStrategy.name} — {highRecordStrategy.wins} wins /{" "}
          {highRecordStrategy.total} trades ({highRecordStrategy.winRate}%)
        </p>

        <div>
          <strong>Strategies with ≥60% Win Rate (min 2 trades):</strong>
          {above60.length > 0 ? (
            <ul>
              {above60.map((s) => (
                <li key={s.name}>
                  {s.name} — {s.winRate}% ({s.wins}/{s.total})
                </li>
              ))}
            </ul>
          ) : (
            <p>None</p>
          )}
        </div>
      </section>

      <section className="stat-block">
        <h3>Health Checks</h3>
        <p>
          <strong>Do you need more live strategies?</strong> {needMoreLive}
          {liveCount < 3 && (
            <span className="warning">
              {" "}
              (Active live: {liveCount})
            </span>
          )}
        </p>

        <div>
          <strong>Do you need to remove any strategy?</strong>{" "}
          {removalCandidates.length > 0 ? (
            <>
              Yes, consider reviewing: <strong>{removalCandidates.join(", ")}</strong>
            </>
          ) : (
            "No, all strategies look healthy."
          )}
        </div>
      </section>
    </div>
  );
};

export default WeeklyReviewPage;