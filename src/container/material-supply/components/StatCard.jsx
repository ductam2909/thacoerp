import React from "react";

const StatCard = ({
  icon,
  label,
  count,
  sub,
  color,
  active = false,
  onClick,
}) => {
  return (
    <div
      className={`stat-card ${active ? "stat-card--active" : ""} ${
        onClick ? "stat-card--clickable" : ""
      }`}
      onClick={onClick}
      style={{ "--stat-color": color }}
    >
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__count">
          {count}
          <span className="stat-card__unit">lệnh</span>
        </div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
};

export default StatCard;