import React from "react";
import { Select as AntdSelect, Form } from "antd";

const Select = ({
  label,
  name,
  options,
  placeholder = "Vui lòng chọn",
  rules = [],
  required = false,
  disabled = false,
  mode,
  showSearch = true,
  noFormItem = true,
  ...rest
}) => {
  const getLabelText = () => {
    if (typeof label === "string") return label.toLowerCase();
    return "trường này";
  };

  const baseRules = required
    ? [{ required: true, message: `Vui lòng chọn ${getLabelText()}` }, ...rules]
    : rules;

  const selectNode = (
    <AntdSelect
      placeholder={placeholder}
      disabled={disabled}
      mode={mode}
      showSearch={showSearch}
      filterOption={(input, option) => {
        const optionLabel = option?.label || option?.children || "";
        return optionLabel
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase());
      }}
      options={options}
      {...rest}
    />
  );

  if (noFormItem) {
    return selectNode;
  }

  return (
    <Form.Item label={label} name={name} rules={baseRules} style={rest.style}>
      {selectNode}
    </Form.Item>
  );
};

export default Select;
