import React, { useState, useContext } from "react";
import { DataContext } from "../../context/DataContext";
import * as api from "../../services/api";
import "./EditStrategyPage.css";

const EditStrategyPage = () => {
  const {
    strategies,
    addStrategyInState,
    updateStrategyInState,
    removeStrategyFromState,
    refresh,
  } = useContext(DataContext);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Breakout",
    image: null,
    rules: "",
  });
  const [isNew, setIsNew] = useState(false);

  const resetForm = () => {
    setForm({ name: "", type: "Breakout", image: null, rules: "" });
    setEditingId(null);
    setIsNew(false);
  };

  const handleEdit = (strategy) => {
    setEditingId(strategy._id);
    setForm({
      name: strategy.name,
      type: strategy.type || "Breakout",
      image: null,
      rules: strategy.rules || "",
    });
    setIsNew(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this strategy?")) {
      try {
        await api.deleteStrategy(id);
        removeStrategyFromState(id);
      } catch (error) {
        console.error("Delete error", error);
        alert("Failed to delete strategy");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("type", form.type);
    fd.append("rules", form.rules);
    if (form.image) fd.append("image", form.image);

    try {
      if (editingId) {
        const { data } = await api.updateStrategy(editingId, fd);
        updateStrategyInState(data);
      } else {
        const { data } = await api.createStrategy(fd);
        addStrategyInState(data);
      }
      resetForm();
      await refresh();
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Could not save strategy";
      alert(message);
      console.error("Save strategy error", error);
    }
  };

  const startNew = () => {
    resetForm();
    setIsNew(true);
  };

  const strategyTypes = ["Breakout", "Pullback", "Reversal", "Range", "Other"];

  return (
    <div className="edit-strategy-page">
      <h2>Manage Strategies</h2>
      <button onClick={startNew}>Add New Strategy</button>

      {(editingId || isNew) && (
        <form className="strategy-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Strategy" : "New Strategy"}</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Strategy Type</label>
            <select name="type" value={form.type} onChange={handleChange}>
              {strategyTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Change Image (optional)</label>
            <input type="file" name="image" accept="image/*" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Strategy Rules (short note, optional)</label>
            <textarea
              name="rules"
              value={form.rules}
              onChange={handleChange}
              placeholder="Add rules or notes about this strategy..."
              rows={3}
            />
          </div>
          <button type="submit">Save</button>
          <button type="button" onClick={resetForm}>Cancel</button>
        </form>
      )}

      <div className="strategy-list">
        {strategies.map((s) => (
          <div key={s._id} className="strategy-item">
            <img src={s.image} alt={s.name} />
            <div>
              <h4>{s.name}</h4>
              <p>Type: {s.type}</p>
              <p>Trade Type: {s.currentTradeType}</p>
              {s.rules && (
                <p className="rules-preview">Rules: {s.rules}</p>
              )}
              <p>Last Modified: {new Date(s.lastModified).toLocaleString()}</p>
              {s.lastModified &&
                new Date() - new Date(s.lastModified) > 15552000000 && (
                  <span className="flag">⚠ Not edited in 6 months</span>
                )}
            </div>
            <div className="actions">
              <button onClick={() => handleEdit(s)}>Edit</button>
              <button onClick={() => handleDelete(s._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditStrategyPage;