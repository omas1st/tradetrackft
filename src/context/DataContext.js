import React, { createContext, useState, useEffect, useCallback } from "react";
import * as api from "../services/api";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [strategies, setStrategies] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [dailyBias, setDailyBias] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = useCallback(async () => {
    try {
      const { data } = await api.getStrategies();
      setStrategies(data);
    } catch (error) {
      console.error("Failed to fetch strategies", error);
    }
  }, []);

  const fetchPairs = useCallback(async () => {
    try {
      const { data } = await api.getPairs();
      setPairs(data);
    } catch (error) {
      console.error("Failed to fetch pairs", error);
    }
  }, []);

  const fetchDailyBias = useCallback(async () => {
    try {
      const { data } = await api.getTodayBias();
      setDailyBias(data.bias || null);
    } catch (error) {
      console.error("Failed to fetch daily bias", error);
    }
  }, []);

  const updateStrategyInState = (updated) => {
    setStrategies((prev) =>
      prev.map((s) => (s._id === updated._id ? updated : s))
    );
  };

  const addStrategyInState = (newStrategy) => {
    setStrategies((prev) => [...prev, newStrategy]);
  };

  const removeStrategyFromState = (id) => {
    setStrategies((prev) => prev.filter((s) => s._id !== id));
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStrategies(), fetchPairs(), fetchDailyBias()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStrategies, fetchPairs, fetchDailyBias]);

  // Derive notifications from strategies (simplified)
  useEffect(() => {
    const notifs = [];
    strategies.forEach((s) => {
      if (s.consecutiveLosses >= 3) {
        notifs.push({
          id: `loss-${s._id}`,
          type: "danger",
          message: `Strategy ${s.name}: 3 losses in a row. Paused until 3 demo wins.`,
        });
      }
      if (s.consecutiveWins >= 3) {
        notifs.push({
          id: `win-${s._id}`,
          type: "success",
          message: `Strategy ${s.name}: 3 wins in a row. Remove pause if previously paused.`,
        });
      }
      if (s.lastTradeDate) {
        const daysSince = (new Date() - new Date(s.lastTradeDate)) / 86400000;
        if (daysSince > 30) {
          notifs.push({
            id: `inactive-${s._id}`,
            type: "warning",
            message: `Strategy ${s.name}: No trades recorded in 30 days. Review or archive.`,
          });
        }
      }
    });
    if (!dailyBias) {
      notifs.push({
        id: "bias",
        type: "info",
        message: "Please enter today's daily bias before recording trades.",
      });
    }
    setNotifications(notifs);
  }, [strategies, dailyBias]);

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchStrategies(), fetchPairs(), fetchDailyBias()]);
    setLoading(false);
  };

  return (
    <DataContext.Provider
      value={{
        strategies,
        pairs,
        dailyBias,
        setDailyBias,
        notifications,
        loading,
        fetchStrategies,
        fetchPairs,
        fetchDailyBias,
        updateStrategyInState,
        addStrategyInState,
        removeStrategyFromState,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};