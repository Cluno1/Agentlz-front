import { useState } from "react";
import { Menu as RAMenu, usePermissions, useTranslate } from "react-admin";
import { People, Settings, AccountCircle } from "@mui/icons-material";
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
        to="/profile"
        primaryText={translate("menu.profile")}
        leftIcon={<AccountCircle />}
      />
      {permissions === "admin" && (
        <SubMenu
          handleToggle={handleToggle}
          isOpen={open}
          name={translate("menu.Management")}
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
    </RAMenu>
  );
};
