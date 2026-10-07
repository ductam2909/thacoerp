import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { App as AntdApp, ConfigProvider } from 'antd';
import { setNotificationInstances } from './utils/notification';
import { NotificationProvider } from './contexts/NotificationContext';
import viVN from "antd/locale/vi_VN"; 
import dayjs from "dayjs"; 
import "dayjs/locale/vi"; 
// Router
import Router from './routers';

/**
 * Global notification setup — lấy instance từ AntdApp context
 */
const GlobalNotification = () => {
  const { message, notification } = AntdApp.useApp();
  setNotificationInstances(message, notification);
  return null;
};
dayjs.locale("vi");


const App = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#0569b9',
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 15,
          },
        }}
      >
        <AntdApp>
          <NotificationProvider>
            <GlobalNotification />
            <Router />
          </NotificationProvider>
        </AntdApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
