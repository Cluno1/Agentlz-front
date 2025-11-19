import { useState } from "react";
import { Menu as RAMenu, usePermissions, useTranslate } from "react-admin";
import {
  People,
  Settings,
  AccountCircle,
  SmartToy,
  Build,
  Create,
} from "@mui/icons-material";
import SubMenu from "../components/SubMenu";

export const Menu = () => {
  const translate = useTranslate();
  const { permissions } = usePermissions();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <RAMenu>
      <RAMenu.DashboardItem primaryText={translate("menu.dashboard")} />

      <RAMenu.Item
        to="/agent"
        primaryText={translate("menu.agent")}
        leftIcon={<SmartToy />}
      />
      <RAMenu.Item
        to="/mcp-tools"
        primaryText={translate("menu.mcpTools")}
        leftIcon={<Build />}
      />
      <RAMenu.Item
        to="/create"
        primaryText={translate("menu.create")}
        leftIcon={<Create />}
      />
      {permissions === "admin" && (
        <SubMenu
          handleToggle={handleToggle}
          isOpen={open}
          name={"menu.Management"}
          icon={<Settings />}
        >
          <RAMenu.Item
            to="/user-management"
            primaryText={translate("menu.userManagement")}
            leftIcon={<People />}
          />
          <RAMenu.Item
            to="/system-management"
            primaryText={translate("menu.systemManagement")}
            leftIcon={<Settings />}
          />
        </SubMenu>
      )}
      <RAMenu.Item
        to="/profile"
        primaryText={translate("menu.profile")}
        leftIcon={<AccountCircle />}
      />
    </RAMenu>
  );
};
