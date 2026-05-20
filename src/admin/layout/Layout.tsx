import type { ReactNode } from "react";
import { useEffect } from "react";
import { Layout as RALayout, CheckForApplicationUpdate } from "react-admin";
import { Menu } from "./Menu";
import { AppBar } from "./AppBar";
import { WSMonitor } from "../components/WSMonitor";
import { ArcoLocaleBridge } from "../components/ArcoLocaleBridge";
import { wsClient } from "../data/wsClient";

export const Layout = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    wsClient.connect();
    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <ArcoLocaleBridge>
      <RALayout menu={Menu} appBar={AppBar}>
        {children}
        <CheckForApplicationUpdate />
        <WSMonitor />
      </RALayout>
    </ArcoLocaleBridge>
  );
};
