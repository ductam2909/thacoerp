import { useState } from "react";
import { Button, Checkbox, Input } from "antd";

const MultiSelectFilterDropdown = ({
  options = [],
  selectedKeys = [],
  setSelectedKeys,
  confirm,
  clearFilters,
  width,
  searchPlaceholder = "Tìm kiếm",
  resetText = "Đặt lại",
  confirmText = "OK",
}) => {
  const [searchText, setSearchText] = useState("");

  const normalizedSearch = searchText.trim().toLowerCase();

  const visibleOptions = options.filter((option) =>
    String(option?.label ?? "")
      .toLowerCase()
      .includes(normalizedSearch),
  );

  const handleReset = () => {
    setSelectedKeys([]);
    setSearchText("");

    clearFilters?.({
      closeDropdown: true,
      confirm: true,
    });
  };

  const handleConfirm = () => {
    confirm({
      closeDropdown: true,
    });
  };

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      style={{
        padding: 8,
      }}
    >
      <Input
        allowClear
        placeholder={searchPlaceholder}
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        style={{ marginBottom: 8 }}
      />

      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          padding: "4px 0",
          maxWidth:width
        }}
      >
        <Checkbox.Group
          value={selectedKeys}
          onChange={(values) => setSelectedKeys(values)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          {visibleOptions.map((option) => (
            <Checkbox key={option.value} value={option.value}>
              {option.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 12,
        }}
      >
        <Button type="text" onClick={handleReset}>
          {resetText}
        </Button>

        <Button type="primary" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
};

export default MultiSelectFilterDropdown;
