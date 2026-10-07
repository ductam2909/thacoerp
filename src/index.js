import React from "react";
import '@ant-design/v5-patch-for-react-19';
import ReactDOM from "react-dom/client";
import App from "./App";

import "antd/dist/reset.css";
import "./assets/scss/index.scss";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />,
);
