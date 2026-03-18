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
import TenantManagement from "./resources/management/TenantManagement";
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
import McpToolsPage from "./resources/mcp/McpToolsPage";
import RagIndexPage from "./resources/rag";
import CreatePage from "./resources/create/CreatePage";
import RagUploadPage from "./resources/rag/rag/RagUploadPage";
import RagShow from "./resources/rag/rag/RagShow";
import ChunkPage from "./resources/rag/rag/ChunkPage";
import ChunkShow from "./resources/rag/rag/ChunkShow";
import RagStrategyPage from "./resources/rag/rag/RagStrategyPage";
import RagStrategyAllPage from "./resources/rag/rag/RagStrategyAllPage";
import McpCreatePage from "./resources/mcp/McpCreatePage";
import McpShow from "./resources/mcp/McpShow";
import Evaluation from "./resources/evaluation";
import EvaluationDatasetUploadPage from "./resources/evaluation/component/EvaluationDatasetUploadPage";
import { wsClient } from "./data/wsClient";
import { ArcoLocaleBridge } from "./components/ArcoLocaleBridge";

const BASENAME = (() => {
  const base = import.meta.env.BASE_URL ?? "/";
  let b = base;
  if (b === "./" || b === "/./") b = "/";
  b = b.replace(/\/+$/, "");
  if (b === "") b = "/";
  if (b !== "/" && !b.startsWith("/")) b = `/${b}`;
  return b === "/" ? undefined : b;
})();

const darkTheme = {
  ...defaultTheme,
  palette: { mode: "dark" },
};

export const App = () => {
  useEffect(() => {
    wsClient.connect();
    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
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
        list={<UserManagement />}
        create={<UserCreate />}
        edit={<UserEdit />}
      />
      <Resource name="system-management" list={<SystemManagement />} />
      <Resource name="tenant-management" list={<TenantManagement />} />
      <Resource name="profile" list={<ProfilePage />} edit={<ProfileEdit />} />
      <Resource name="create" list={<CreatePage />} />
      <Resource name="chat" list={<Chat />} />
      <Resource name="agent" list={<Agent />} />

      <Resource name="evaluation" list={<Evaluation />} />

      <Resource name="mcp-tools" list={<McpToolsPage />} />
      <Resource name="rag" list={<RagIndexPage />} show={<RagShow />} />
      <Resource name="mcp" show={<McpShow />} />

      <CustomRoutes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/rag/knowledge" element={<RagIndexPage />} />
        <Route path="/rag/evaluation" element={<RagIndexPage />} />
        <Route path="/rag/upload" element={<RagUploadPage />} />
        <Route
          path="/evaluation/datasets/upload"
          element={<EvaluationDatasetUploadPage />}
        />
        <Route path="/agent/create" element={<CreateAgent />} />
        <Route path="/mcp/create" element={<McpCreatePage />} />
        <Route path="/rag/:id/chunks" element={<ChunkPage />} />
        <Route path="/rag/:id/chunks/:strategy" element={<ChunkShow />} />
        <Route path="/rag/strategy/all" element={<RagStrategyAllPage />} />
        <Route path="/rag/strategy/:strategyId" element={<RagStrategyPage />} />
      </CustomRoutes>
    </Admin>
  );
};
