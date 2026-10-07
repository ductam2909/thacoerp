import React, { useMemo } from "react";
import { Checkbox, Divider, Popover, Tooltip } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import Button from "../../Button";

const getColumnKey = (column, index) => {
  if (column?.key !== undefined && column?.key !== null) {
    return String(column.key);
  }

  if (Array.isArray(column?.dataIndex)) {
    return column.dataIndex.join(".");
  }

  if (column?.dataIndex !== undefined && column?.dataIndex !== null) {
    return String(column.dataIndex);
  }

  return `column-${index}`;
};

const getColumnLabel = (column, index) => {
  if (typeof column?.columnSettingTitle === "string") {
    return column.columnSettingTitle;
  }

  if (typeof column?.title === "string") {
    return column.title;
  }

  if (typeof column?.dataIndex === "string") {
    return column.dataIndex;
  }

  return `Cột ${index + 1}`;
};

const ColumnVisibilityButton = ({
  columns = [],
  value = [],
  onChange,
  placement = "bottomRight",
  tooltipTitle = "Chọn cột hiển thị",
}) => {
  const columnOptions = useMemo(
    () =>
      columns.map((column, index) => ({
        key: getColumnKey(column, index),
        label: getColumnLabel(column, index),
        hideable: column.hideable !== false,
      })),
    [columns],
  );

  const allColumnKeys = useMemo(
    () => columnOptions.map((item) => item.key),
    [columnOptions],
  );

  const requiredColumnKeys = useMemo(
    () =>
      columnOptions
        .filter((item) => !item.hideable)
        .map((item) => item.key),
    [columnOptions],
  );

  const selectedKeys = Array.isArray(value)
    ? value.map(String)
    : allColumnKeys;

  const handleChange = (checkedKeys) => {
    const nextKeys = Array.from(
      new Set([...checkedKeys.map(String), ...requiredColumnKeys]),
    );

    onChange?.(nextKeys);
  };

  const handleSelectAll = () => {
    onChange?.(allColumnKeys);
  };

  const content = (
    <div style={{ width: 240 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <strong>Hiển thị cột</strong>

        <Button type="link" size="small" onClick={handleSelectAll}>
          Chọn tất cả
        </Button>
      </div>

      <Divider style={{ margin: "8px 0 12px" }} />

      <Checkbox.Group
        value={selectedKeys}
        onChange={handleChange}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {columnOptions.map((item) => (
          <Checkbox
            key={item.key}
            value={item.key}
            disabled={!item.hideable}
          >
            {item.label}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </div>
  );

  return (
    <Popover
      content={content}
      placement={placement}
      trigger="click"
      destroyOnHidden
    >
      <Tooltip title={tooltipTitle} placement="top">
        <Button
          type="text"
          className="task-column-setting-btn"
          icon={<SettingOutlined />}
          aria-label={tooltipTitle}
        />
      </Tooltip>
    </Popover>
  );
};

export default ColumnVisibilityButton;
