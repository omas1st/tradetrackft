import axios from "axios";

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

// Strategies
export const getStrategies = () => API.get("/strategies");
export const createStrategy = (formData) => API.post("/strategies", formData); // multipart if image
export const updateStrategy = (id, formData) => API.put(`/strategies/${id}`, formData);
export const deleteStrategy = (id) => API.delete(`/strategies/${id}`);

// Pairs
export const getPairs = () => API.get("/pairs");

// Trades
export const recordTrade = (tradeData) => API.post("/trades", tradeData);
export const getTrades = (params) => API.get("/trades", { params });

// Upload image (via backend)
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Analysis – Preview
export const getAnalysisPreview = (params) => API.get("/analysis/preview", { params });

// Analysis – Decision
export const getAnalysisDecision = (params) => API.get("/analysis/decision", { params });

// Next Trade Suggestion
export const getNextTradeSuggestion = () => API.get("/analysis/next-trade");

// Weekly Review
export const getWeeklyReview = () => API.get("/weekly-review");
export const submitWeeklyReview = (answers) => API.post("/weekly-review", answers);

// Daily Bias
export const setDailyBias = (bias) => API.post("/daily-bias", { bias });
export const getTodayBias = () => API.get("/daily-bias/today");

// Notifications (we derive them from strategies / trades, but you can also get from backend)
export const getNotifications = () => API.get("/notifications");