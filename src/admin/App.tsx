import { Admin, CustomRoutes, Resource, useLocale } from "react-admin";
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
import ProfileEdit from "./resources/profile/ProfileEdit";
import { dataProvider } from "./data/provider";
import { i18nProvider } from "./i18n/i18nProvider";
import { ConfigProvider } from "@arco-design/web-react";
import zhCN from "@arco-design/web-react/es/locale/zh-CN";
import enUS from "@arco-design/web-react/es/locale/en-US";
import AgentPage from "./resources/agent/AgentPage";
import McpToolsPage from "./resources/tools/McpToolsPage";
import CreatePage from "./resources/create/CreatePage";

const BASENAME = (() => {
  const base = import.meta.env.BASE_URL ?? "/";
  let b = base;
  if (b === "./" || b === "/./") b = "/";
  b = b.replace(/\/+$/, "");
  if (b === "") b = "/";
  if (b !== "/" && !b.startsWith("/")) b = `/${b}`;
  return b === "/" ? undefined : b;
})();

const ArcoLocaleBridge = ({ children }: { children: React.ReactNode }) => {
  const locale = useLocale();
  console.log(locale, "locale");
  const arcoLocale = locale === "en" ? enUS : zhCN;
  return <ConfigProvider locale={arcoLocale}>{children}</ConfigProvider>;
};

export const App = () => (
  <Admin
    layout={Layout}
    basename={BASENAME}
    authProvider={authProvider}
    dataProvider={dataProvider}
    i18nProvider={i18nProvider}
    loginPage={LoginPage}
    dashboard={DashboardPage}
  >
    <Resource
      name="user-management"
      list={
        <ArcoLocaleBridge>
          <UserManagement />
        </ArcoLocaleBridge>
      }
      create={<UserCreate />}
      edit={<UserEdit />}
    />
    <Resource
      name="system-management"
      list={
        <ArcoLocaleBridge>
          <SystemManagement />
        </ArcoLocaleBridge>
      }
    />
    {/* 公开路由：注册页（不需要认证） */}
    <CustomRoutes noLayout>
      <Route path="/register" element={<RegisterPage />} />
    </CustomRoutes>
    <CustomRoutes>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/edit" element={<ProfileEdit />} />
      <Route
        path="/agent"
        element={
          <ArcoLocaleBridge>
            <AgentPage />
          </ArcoLocaleBridge>
        }
      />
      <Route
        path="/mcp-tools"
        element={
          <ArcoLocaleBridge>
            <McpToolsPage />
          </ArcoLocaleBridge>
        }
      />
      <Route
        path="/create"
        element={
          <ArcoLocaleBridge>
            <CreatePage />
          </ArcoLocaleBridge>
        }
      />
    </CustomRoutes>
  </Admin>
);
