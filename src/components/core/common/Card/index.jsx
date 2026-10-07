import React from "react";
import { Row, Col, Space } from "antd";

const Card = ({ title, extra, children, className = "", style, ...rest }) => {
  return (
    <div className={`app-card ${className}`} style={style} {...rest}>
      {(title || extra) && (
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16, rowGap: 16 }}
        >
          <Col xs={24} sm={16}>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {title}
              </h3>
            )}
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: "right" }}>
            {extra && <Space wrap>{extra}</Space>}
          </Col>
        </Row>
      )}
      <div className="app-card-body">{children}</div>
    </div>
  );
};

export default Card;
