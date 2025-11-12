import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { authProvider } from "./auth/mockAuthProvider";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import DashboardPage from "./resources/dashboard/DashboardPage";
import { UserManagement } from "./resources/management/userManagement";
import UserCreate from "./resources/management/userManagement/UserCreate";
import UserEdit from "./resources/management/userManagement/UserEdit";
import { SystemManagement } from "./resources/management/SystemManagement";
import ProfilePage from "./resources/profile";
import { dataProvider } from "./data/provider";

export const App = () => (
  <Admin
    layout={Layout}
    authProvider={authProvider}
    dataProvider={dataProvider}
    loginPage={LoginPage}
    dashboard={DashboardPage}
  >
    <Resource
      name="user-management"
      list={<UserManagement />}
      create={<UserCreate />}
      edit={<UserEdit />}
    />
    <Resource name="system-management" list={<SystemManagement />} />
    {/* 公开路由：注册页（不需要认证） */}
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
    <CustomRoutes>
      <Route path="/profile" element={<ProfilePage />} />
    </CustomRoutes>
  </Admin>
);
