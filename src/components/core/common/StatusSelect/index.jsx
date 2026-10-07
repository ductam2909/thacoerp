import React from "react";
import { Select, Tooltip } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { getStatusConfig } from "../../../../helpers/common/status.helper";

const StatusSelect = ({
  value,
  options,
  onChange,
  disabled = false,
  readOnly = false,
  config = getStatusConfig,
  currentConfig = null,
  showSearch = false,
  minWidth = "100px",
  selectWidth = "100%",
}) => {
  const resolvedCurrentConfig = currentConfig || config(value);
  const { color, background, fontColor, label } = resolvedCurrentConfig;
  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );
  const tooltipTitle =
    selectedOption?.description || selectedOption?.label || label;

  const mappedStatusOptions = options.map((opt) => {
    const conf = config(opt.value);
    const searchText = [opt.label, opt.description, opt.value]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return {
      ...opt,
      searchText,
      labelProp: (
        <span
          style={{ color: conf.fontColor, fontWeight: 500, fontSize: "13px" }}
        >
          {opt.label}
        </span>
      ),
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: `2px solid ${conf.fontColor}`,
              backgroundColor: conf.color,
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: conf.fontColor,
                fontWeight: 500,
                lineHeight: "1.2",
                fontSize: "13px",
              }}
            >
              {opt.label}
            </span>
            {opt.description && (
              <span
                style={{
                  color: "#8c8c8c",
                  marginTop: "4px",
                  lineHeight: "1.2",
                }}
              >
                {opt.description}
              </span>
            )}
          </div>
        </div>
      ),
    };
  });
  return (
    // <Tooltip title={tooltipTitle}>
      <div
        style={{
          background: background || color,
          borderRadius: "12px",
          minWidth,
          width: selectWidth,
          maxWidth: "none",
          padding: "0 2px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Select
          size="small"
          value={value}
          options={mappedStatusOptions}
          optionLabelProp="labelProp"
          style={{
            width: selectWidth,
            pointerEvents: readOnly ? "none" : undefined,
            fontSize: "13px",
          }}
          styles={{
            popup: {
              root: { minWidth: 150, borderRadius: "12px" },
            },
            selector: {
              display: "flex",
              alignItems: "center",
              paddingInline: 2,
            },
          }}
          variant="borderless"
          className="task-status-select"
          onChange={onChange}
          disabled={disabled}
          showSearch={showSearch}
          optionFilterProp="searchText"
          filterOption={(input, option) =>
            option?.searchText?.includes(input.toLowerCase())
          }
          suffixIcon={
            !readOnly && !disabled ? (
              <DownOutlined
                style={{
                  color: fontColor,
                  fontSize: "12px",
                  pointerEvents: "none",
                }}
              />
            ) : null
          }
        />
      </div>
    // </Tooltip>
  );
};

export default StatusSelect;
