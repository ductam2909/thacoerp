import React from "react";
import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

const ModalConfirm = ({
  open,
  title,
  content,
  onOk,
  onCancel,
  okText = "Xác nhận",
  cancelText = "Hủy",
  okButtonProps,
  cancelButtonProps,
  ...props
}) => {
  return (
    <Modal
      title={null}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ type: "primary", ...okButtonProps }}
      cancelButtonProps={cancelButtonProps}
      centered
      closable={false}
      width={500}
      {...props}
    >
      <div style={{ marginTop: 8, marginBottom: 16, minHeight: 60 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <ExclamationCircleFilled style={{ color: "#faad14", fontSize: 22 }} />
          <div style={{ fontWeight: 600, fontSize: 16, color: "#262626" }}>
            {title}
          </div>
        </div>
        <div style={{ color: "#595959", fontSize: 14, paddingLeft: 34 }}>
          {content}
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfirm;
