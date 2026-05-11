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

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.getNotifications();
      // Always merge read status from existing state (keep already read flags)
      setNotifications((prev) => {
        const prevReadMap = {};
        prev.forEach((n) => { prevReadMap[n.id] = n.read; });
        return data.map((n) => ({
          ...n,
          read: prevReadMap[n.id] !== undefined ? prevReadMap[n.id] : n.read || false,
        }));
      });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
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

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStrategies(),
        fetchPairs(),
        fetchDailyBias(),
        fetchNotifications(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchStrategies, fetchPairs, fetchDailyBias, fetchNotifications]);

  const refresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchStrategies(),
      fetchPairs(),
      fetchDailyBias(),
      fetchNotifications(),
    ]);
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
        markNotificationAsRead,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};