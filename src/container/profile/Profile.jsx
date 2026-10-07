import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  BackwardOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import PageContainer from "../../components/core/common/PageContainer";
import { useAppSelector } from "../../store/hooks";
import { authService } from "../../services/authService";
import { getRequest } from "../../services/baseService";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { toast } from "../../utils/notification";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const firstValue = (source, keys, fallback = "") =>
  keys
    .map((key) => source?.[key])
    .find((value) => value !== undefined && value !== null && value !== "") ??
  fallback;

const Profile = () => {
  const authUser = useAppSelector((state) => state.auth.user) || {};
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();

  const userId = firstValue(authUser, ["userId", "id", "sub"]);
  const fullName = firstValue(
    user,
    ["fullName", "name", "userName", "username"],
    "Người dùng",
  );
  const email = firstValue(user, ["email", "emailAddress"]);
  const roles = useMemo(() => {
    const value = firstValue(
      user,
      ["lst_RoleNames", "roles", "permissions"],
      [],
    );
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        const response = await getRequest(
          API_ENDPOINTS.USER.GET_BY_ID.replace("{userId}", userId),
        );
        const detail = response?.data || response?.Data || response;
        if (detail && typeof detail === "object")
          setUser((current) => ({ ...current, ...detail }));
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };
    loadProfile();
  }, [userId]);

  const changePassword = async (values) => {
    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      toast.success("Đổi mật khẩu thành công!");
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      toast.error(
        "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại!",
      );
    } finally {
      setLoading(false);
    }
  };

  // const profileContent = (
  //   <Form layout="vertical" className="profile-form">
  //     <Row gutter={20}>
  //       <Col xs={24} md={12}>
  //         <Form.Item label="Họ và tên">
  //           <Input prefix={<UserOutlined />} value={fullName} readOnly />
  //         </Form.Item>
  //       </Col>
  //       <Col xs={24} md={12}>
  //         <Form.Item label="Email">
  //           <Input prefix={<MailOutlined />} value={email} readOnly />
  //         </Form.Item>
  //       </Col>
  //     </Row>
  //   </Form>
  // );

  const passwordContent = (
    <Form
      form={passwordForm}
      layout="vertical"
      onFinish={changePassword}
      className="profile-form password-form"
    >
      <Form.Item
        name="oldPassword"
        label="Mật khẩu hiện tại"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
      >
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="Mật khẩu mới"
        rules={[
          { required: true, message: "Vui lòng nhập mật khẩu mới" },
          { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Xác nhận mật khẩu mới"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "Vui lòng xác nhận mật khẩu" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              return !value || getFieldValue("newPassword") === value
                ? Promise.resolve()
                : Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
            },
          }),
        ]}
      >
        <Input.Password prefix={<SafetyCertificateOutlined />} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>
        Đổi mật khẩu
      </Button>
    </Form>
  );

  return (
    <PageContainer
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản và bảo mật"
      actionButtons={[
        <div className="project-header-btn-back" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined style={{ paddingRight: 5 }} /> Quay lại
        </div>,
      ]}
    >
      <Card
        className="profile-page"
        // bordered={false}
      >
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={7} xl={6} className="profile-summary">
            <Avatar size={88} icon={<UserOutlined />} />
            <Title level={4}>{fullName}</Title>
            {email && <Text type="secondary">{email}</Text>}
            {/* <div className="profile-role-list">
              {roles.map((role) => (
                <Tag color="blue" key={role}>
                  {role}
                </Tag>
              ))}
            </div> */}
            <div className="profile-meta">
              <span>Phòng ban</span>
              <strong>
                {firstValue(user, ["departmentName"], "Chưa cập nhật")}
              </strong>
            </div>
            <div className="profile-meta">
              <span>Chức vụ</span>
              <strong>
                {firstValue(user, ["positionName"], "Chưa cập nhật")}
              </strong>
            </div>
          </Col>
          <Col xs={24} lg={17} xl={18} className="profile-detail">
            <Tabs
              items={[
                // {
                //   key: "info",
                //   label: "Thông tin cá nhân",
                //   children: profileContent,
                // },
                {
                  key: "password",
                  label: "Đổi mật khẩu",
                  children: passwordContent,
                },
              ]}
            />
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default Profile;
