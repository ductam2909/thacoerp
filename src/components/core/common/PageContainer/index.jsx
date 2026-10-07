import React from "react";
import { Space, Typography, Input, Segmented, Select as AntSelect } from "antd";
import {
  AppstoreOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const PageContainer = ({
  title,
  subtitle,
  searchPlaceholder = "Tìm kiếm...",
  searchValue,
  searchDefaultValue,
  onSearch,
  onSearchChange,

  filterOptions,
  filterValue,
  onFilterChange,
  onkeyDownSearch,

  viewMode,
  onViewModeChange,
  viewModeOptions = [
    { value: "list", icon: <UnorderedListOutlined /> },
    { value: "grid", icon: <AppstoreOutlined /> },
  ],

  actionButtons,
  headerTabs,

  extra,
  hideScroll,
  children,
  className = "",
  style = {},
}) => {
  return (
    <div className={`page-container ${className}`} style={style}>
      {(title ||
        onSearch ||
        onSearchChange ||
        filterOptions ||
        viewMode ||
        actionButtons ||
        extra ||
        headerTabs) && (
        <div className="page-header">
          <div
            className="page-header-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Space direction="vertical" size={2} className="page-header-left">
              {title && (
                <Title level={4} className="page-title">
                  {title}
                </Title>
              )}
              {subtitle && (
                <div style={{ color: "#6b7280", fontSize: "13px" }}>
                  {subtitle}
                </div>
              )}
            </Space>

            {(onSearch ||
              onSearchChange ||
              filterOptions ||
              viewMode ||
              actionButtons ||
              extra) && (
              <div className="page-header-right" style={{ flex: "1 1 auto" }}>
                {(onSearch || onSearchChange) && (
                  <Input
                    placeholder={searchPlaceholder}
                    prefix={<SearchOutlined />}
                    {...(searchValue !== undefined
                      ? { value: searchValue }
                      : { defaultValue: searchDefaultValue })}
                    onChange={(e) =>
                      onSearchChange
                        ? onSearchChange(e.target.value)
                        : onSearch?.(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSearch?.(e.target.value);
                      }
                      onkeyDownSearch?.(e, e.target.value);
                    }}
                    className="page-search-input"
                    allowClear
                  />
                )}

                {(filterOptions || viewMode) && (
                  <div
                    style={{ display: "flex", gap: "12px", flex: "0 1 auto" }}
                    className="page-header-filter-wrapper"
                  >
                    {filterOptions && (
                      <AntSelect
                        value={filterValue}
                        defaultValue={filterOptions[0]?.value}
                        onChange={onFilterChange}
                        style={{ flex: 1, minWidth: 160 }}
                        options={filterOptions}
                      />
                    )}
                    {viewMode && (
                      <Segmented
                        value={viewMode}
                        onChange={onViewModeChange}
                        options={viewModeOptions.map((opt) => ({
                          value: opt.value,
                          disabled: opt.disabled,
                          className: opt.className,
                          ...(opt.label
                            ? {
                                label: (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "0 4px",
                                    }}
                                  >
                                    {opt.icon && (
                                      <span
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        {opt.icon}
                                      </span>
                                    )}
                                    <span>{opt.label}</span>
                                  </div>
                                ),
                              }
                            : {
                                icon: opt.icon,
                              }),
                        }))}
                      />
                    )}
                  </div>
                )}

                {actionButtons &&
                  React.Children.toArray(actionButtons).map((btn, index) => (
                    <React.Fragment key={btn.key || index}>
                      {btn}
                    </React.Fragment>
                  ))}

                {extra &&
                  React.Children.toArray(extra).map((item, index) => (
                    <React.Fragment key={item.key || index}>
                      {item}
                    </React.Fragment>
                  ))}
              </div>
            )}
          </div>
          {headerTabs && <div className="page-header-tabs">{headerTabs}</div>}
        </div>
      )}

      <div className={`page-content ${hideScroll ? "hide-scroll" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
