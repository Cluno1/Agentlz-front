import {
  Admin,
  CustomRoutes,
  Resource,
  useLocale,
  defaultTheme,
} from "react-admin";
import { Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { authProvider } from "./data/provider/authProvider";
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
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import zhCN from "@arco-design/web-react/es/locale/zh-CN";
import enUS from "@arco-design/web-react/es/locale/en-US";
import Chat from "./resources/chat";
import Agent from "./resources/agent";
import CreateAgent from "./resources/agent/CreateAgent";
import McpToolsPage from "./resources/tools/McpToolsPage";
import RagPage from "./resources/rag/RagPage";
import CreatePage from "./resources/create/CreatePage";
import RagUploadPage from "./resources/rag/RagUploadPage";
import RagShow from "./resources/rag/RagShow";

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
  const arcoLocale = locale === "en" ? enUS : zhCN;
  const muiTheme = useTheme();
  useEffect(() => {
    const body = document.body;
    const isDark = muiTheme.palette.mode === "dark";
    if (isDark) {
      body.setAttribute("arco-theme", "dark");
      body.style.setProperty("background-color", "var(--color-bg-1)");
      body.style.setProperty("color", "var(--color-text-1)");
      body.style.setProperty("color-scheme", "dark");
    } else {
      body.removeAttribute("arco-theme");
      body.style.removeProperty("background-color");
      body.style.removeProperty("color");
      body.style.setProperty("color-scheme", "light");
    }
  }, [muiTheme.palette.mode]);
  return <ConfigProvider locale={arcoLocale}>{children}</ConfigProvider>;
};

const darkTheme = {
  ...defaultTheme,
  palette: { mode: "dark" },
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
    darkTheme={darkTheme}
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
    <Resource
      name="profile"
      list={
        <ArcoLocaleBridge>
          <ProfilePage />
        </ArcoLocaleBridge>
      }
      edit={<ProfileEdit />}
    />
    <Resource
      name="create"
      list={
        <ArcoLocaleBridge>
          <CreatePage />
        </ArcoLocaleBridge>
      }
    />
    <Resource
      name="chat"
      list={
        <ArcoLocaleBridge>
          <Chat />
        </ArcoLocaleBridge>
      }
    />
    <Resource
      name="agent"
      list={
        <ArcoLocaleBridge>
          <Agent />
        </ArcoLocaleBridge>
      }
    />

    <Resource
      name="mcp-tools"
      list={
        <ArcoLocaleBridge>
          <McpToolsPage />
        </ArcoLocaleBridge>
      }
    />
    <Resource
      name="rag"
      list={
        <ArcoLocaleBridge>
          <RagPage />
        </ArcoLocaleBridge>
      }
      show={
        <ArcoLocaleBridge>
          <RagShow />
        </ArcoLocaleBridge>
      }
    />

    {/* 公开路由：注册页（不需要认证） */}

    <CustomRoutes>
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/rag/upload"
        element={
          <ArcoLocaleBridge>
            <RagUploadPage />
          </ArcoLocaleBridge>
        }
      />
      <Route
        path="/agent/create"
        element={
          <ArcoLocaleBridge>
            <CreateAgent />
          </ArcoLocaleBridge>
        }
      />
    </CustomRoutes>
  </Admin>
);
