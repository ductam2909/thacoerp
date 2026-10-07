import React from "react";
import { Modal as AntdModal } from "antd";
import { APP_COLORS } from "../../../../constants/colors";

const Modal = ({
  title,
  open,
  onCancel,
  onOk,
  children,
  footer,
  width = 650,
  styles,
  ...rest
}) => {
  // Bọc lại title để làm to và đậm hơn
  const styledTitle = title ? (
    <div
      style={{
        fontSize: 18,
        fontWeight: 600,
        color: APP_COLORS.TEXT_MAIN,
        letterSpacing: "0.3px",
      }}
    >
      {title}
    </div>
  ) : null;

  // Cấu hình style hiện đại cho các khối của Modal
  const modernStyles = {
    header: {
      paddingBottom: 16,
      borderBottom: `1px solid ${APP_COLORS.BORDER}`,
      marginBottom: 24,
      ...(styles?.header || {}),
    },
    content: {
      borderRadius: 12,
      padding: 24,
      boxShadow: APP_COLORS.SHADOW_LG,
      ...(styles?.content || {}),
    },
    body: {
      ...(styles?.body || {}),
    },
    mask: {
      ...(styles?.mask || {}),
    },
  };

  return (
    <AntdModal
      title={styledTitle}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      footer={footer}
      destroyOnHidden
      centered
      width={width}
      styles={modernStyles}
      {...rest}
      maskClosable={false}
    >
      {children}
    </AntdModal>
  );
};

// Kế thừa các phương thức gọi nhanh của Ant Design (Modal.confirm, Modal.info, v.v.)
Modal.confirm = AntdModal.confirm;
Modal.info = AntdModal.info;
Modal.success = AntdModal.success;
Modal.error = AntdModal.error;
Modal.warning = AntdModal.warning;

export default Modal;
