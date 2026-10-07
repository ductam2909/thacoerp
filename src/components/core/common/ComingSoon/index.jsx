import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import PageContainer from "../PageContainer";
import { DashboardOutlined } from "@ant-design/icons";

const ComingSoon = () => {
  const navigate = useNavigate();
  return (
    <PageContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Result
          status="404"
          title="Chức năng đang phát triển"
          subTitle="Tính năng này hiện đang được xây dựng và sẽ sớm ra mắt trong thời gian tới !"
          extra={
            <Button
              type="primary"
              icon={<DashboardOutlined />}
              onClick={() => navigate("/dashboard")}
            >
              Về trang tổng quan
            </Button>
          }
        />
      </div>
    </PageContainer>
  );
};

export default ComingSoon;
