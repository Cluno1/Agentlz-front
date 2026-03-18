import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate } from "react-admin";
import { Menu } from "./Menu";
import { AppBar } from "./AppBar";
import { WSMonitor } from "../components/WSMonitor";
import { ArcoLocaleBridge } from "../components/ArcoLocaleBridge";

export const Layout = ({ children }: { children: ReactNode }) => {
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
