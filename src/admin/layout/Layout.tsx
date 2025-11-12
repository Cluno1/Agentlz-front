import type { ReactNode } from "react";
import { Layout as RALayout, CheckForApplicationUpdate } from "react-admin";
import { Menu } from "./Menu";
import { AppBar } from "./AppBar";

export const Layout = ({ children }: { children: ReactNode }) => (
  <RALayout menu={Menu} appBar={AppBar}>
    {children}
    <CheckForApplicationUpdate />
  </RALayout>
);
