import React from "react";
import { Progress, Spin } from "antd";
import { CloseOutlined, StopOutlined } from "@ant-design/icons";

const panelStyle = {
  position: "fixed",
  right: 16,
  width: "min(360px, calc(100vw - 32px))",
  padding: "14px 16px",
  background: "#fff",
  border: "1px solid #d9d9d9",
  borderRadius: 8,
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
};

const FileTransferProgress = ({
  items = [],
  title,
  top = 16,
  zIndex = 1100,
  onClose,
  onCancelItem,
  maxBodyHeight = 260,
}) => {
  if (!items.length) return null;

  return (
    <div style={{ ...panelStyle, top, zIndex }}>
      <div
        style={{
          fontWeight: 600,
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>{title}</span>
        {onClose && (
          <CloseOutlined
            onClick={onClose}
            style={{ cursor: "pointer", color: "#8c8c8c" }}
          />
        )}
      </div>
      <div style={{ maxHeight: maxBodyHeight, overflowY: "auto" }}>
        {items.map((item, index) => {
          const percent = Number(item.percent) || 0;
          const name = item.name || `File ${index + 1}`;
          const itemKey = item.key || item.id || `${name}-${index}`;

          return (
            <div
              key={itemKey}
              style={{ marginBottom: 10 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <Spin size="small" />
                <span
                  title={name}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
                <span>{percent}%</span>
                {onCancelItem && (
                  <StopOutlined
                    onClick={() => onCancelItem(item)}
                    style={{
                      cursor: "pointer",
                      color: "#d4380d",
                      fontSize: 14,
                    }}
                    title="Hủy file này"
                  />
                )}
              </div>
              <Progress percent={percent} size="small" showInfo={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileTransferProgress;
