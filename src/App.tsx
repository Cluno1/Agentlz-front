import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";
import { Layout } from "./admin/layout/Layout";
import { authProvider } from "./admin/auth/mockAuthProvider";
import LoginPage from "./admin/auth/LoginPage";
import RegisterPage from "./admin/auth/RegisterPage";
import DashboardPage from "./admin/resources/dashboard/DashboardPage";
import { UserManagement } from "./admin/resources/management/userManagement";
import { SystemManagement } from "./admin/resources/management/SystemManagement";

export const App = () => (
  <Admin
    layout={Layout}
    authProvider={authProvider}
    loginPage={LoginPage}
    dashboard={DashboardPage}
  >
    <Resource name="user-management" list={<UserManagement />} />
    <Resource name="system-management" list={<SystemManagement />} />
    {/* 公开路由：注册页（不需要认证） */}
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
  </Admin>
);
