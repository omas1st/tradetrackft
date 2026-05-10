import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Header from "./components/Layout/Header";
import HomePage from "./pages/HomePage/HomePage";
import RecordTradePage from "./pages/RecordTradePage/RecordTradePage";
import EditStrategyPage from "./pages/EditStrategyPage/EditStrategyPage";
import AnalysisPreviewPage from "./pages/AnalysisPreviewPage/AnalysisPreviewPage";
import AnalysisDecisionPage from "./pages/AnalysisDecisionPage/AnalysisDecisionPage";
import PastTradesPage from "./pages/PastTradesPage/PastTradesPage";
import WeeklyReviewPage from "./pages/WeeklyReviewPage/WeeklyReviewPage";
import "./App.css";

function App() {
  return (
    <DataProvider>
      <Router>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/record-trade" element={<RecordTradePage />} />
            <Route path="/edit-strategy" element={<EditStrategyPage />} />
            <Route path="/analysis-preview" element={<AnalysisPreviewPage />} />
            <Route path="/analysis-decision" element={<AnalysisDecisionPage />} />
            <Route path="/past-trades" element={<PastTradesPage />} />
            <Route path="/weekly-review" element={<WeeklyReviewPage />} />
          </Routes>
        </main>
      </Router>
    </DataProvider>
  );
}

export default App;