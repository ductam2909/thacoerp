import React from "react";
import { Button as AntdButton } from "antd";

const Button = ({
  children,
  type = "primary",
  loading,
  icon,
  danger,
  onClick,
  className,
  ...rest
}) => {
  return (
    <AntdButton
      type={type}
      loading={loading}
      icon={icon}
      danger={danger}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </AntdButton>
  );
};

export default Button;
