import React from "react";
import { Drawer } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const AppDrawer = ({
  title,
  placement = "right",
  onClose,
  open,
  width = 600,
  children,
  ...rest
}) => {
  return (
    <Drawer
      title={title}
      placement={placement}
      onClose={onClose}
      open={open}
      width={width}
      maskClosable={true}
      className="app-drawer"
      closeIcon={
        <CloseOutlined style={{ fontSize: "16px", color: "#64748b" }} />
      }
      styles={{
        header: {
          borderBottom: "1px solid #f1f5f9",
          padding: "20px 24px",
        },
        body: {
          padding: "24px",
          background: "#ffffff",
        },
        content: {
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.08)",
          borderTopLeftRadius: placement === "right" ? 16 : 0,
          borderBottomLeftRadius: placement === "right" ? 16 : 0,
        },
      }}
      {...rest}
    >
      {children}
    </Drawer>
  );
};

export default AppDrawer;
