import React from 'react';
import { Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Input from '../../../components/core/common/Input';
import Button from '../../../components/core/common/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginAsync } from '../../../store/slice/authSlice';

import { toast } from '../../../utils/notification';
import { APP_COLORS } from '../../../constants/colors';


const Login = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);

  const onFinish = (values) => {
    dispatch(loginAsync(values)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Đăng nhập thành công!');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu!');
      }
    });
  };

  return (
    <div className="login-container" style={{ backgroundColor: '#f0f2f5', width: '100%' }}>
      <div className="login-card" style={{ boxShadow: APP_COLORS.SHADOW_LG }}>

        {/* Left Panel: Branding & Gradient */}
        <div
          className="login-left-panel"
          style={{ backgroundColor: '#6296ce' }}
        >
          <div className="login-left-content">
            <div>
              <h1 className="login-title">Đăng nhập</h1>
              <p className="login-subtitle">HỆ THỐNG QUẢN LÝ GIAO VIỆC MÁY</p>
            </div>

            <div className="login-logo-container" style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="http://demo.thacoindustries.vn/static/media/logo.b3e8ca0b.png"
                alt="THACO INDUSTRIES"
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="login-right-panel">
          <div className="login-welcome-container">
            <h2 className="login-welcome-title" style={{ color: APP_COLORS.TEXT_MAIN }}>
              Chào mừng trở lại!
            </h2>
            <p className="login-welcome-desc" style={{ color: APP_COLORS.TEXT_SECONDARY }}>
              Vui lòng nhập thông tin để tiếp tục
            </p>
          </div>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Input
              name="username"
              required
              placeholder="Tên đăng nhập hoặc Mã nhân viên"
              prefix={<UserOutlined style={{ color: APP_COLORS.TEXT_LIGHT, marginRight: 8 }} />}
            />

            <Input
              name="password"
              type="password"
              required
              placeholder="Mật khẩu"
              prefix={<LockOutlined style={{ color: APP_COLORS.TEXT_LIGHT, marginRight: 8 }} />}
            />

            <Form.Item style={{ marginTop: '16px', marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-submit-btn"
                style={{ backgroundColor: '#6296ce', borderColor: '#6296ce', boxShadow: `0 4px 14px 0 #6296ce40` }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
