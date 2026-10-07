import React from "react";
import { Input as AntdInput, Form } from "antd";

const Input = ({
  label,
  name,
  placeholder,
  type = "text",
  rules = [],
  required = false,
  disabled = false,
  maxLength,
  allowClear = true,
  ...rest
}) => {
  const baseRules = required
    ? [
        {
          required: true,
          message: `Vui lòng nhập ${label ? label.toLowerCase() : "trường này"}`,
        },
        ...rules,
      ]
    : rules;

  return (
    <Form.Item label={label} name={name} rules={baseRules}>
      {type === "password" ? (
        <AntdInput.Password
          placeholder={placeholder}
          disabled={disabled}
          allowClear={allowClear}
          maxLength={maxLength}
          {...rest}
        />
      ) : type === "textarea" ? (
        <AntdInput.TextArea
          placeholder={placeholder}
          disabled={disabled}
          allowClear={allowClear}
          maxLength={maxLength}
          rows={4}
          {...rest}
        />
      ) : (
        <AntdInput
          placeholder={placeholder}
          disabled={disabled}
          allowClear={allowClear}
          maxLength={maxLength}
          {...rest}
        />
      )}
    </Form.Item>
  );
};

export default Input;
