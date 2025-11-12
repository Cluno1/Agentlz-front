import { useState } from "react";
import { Menu as RAMenu, usePermissions } from "react-admin";
import { People, Settings, AccountCircle } from "@mui/icons-material";
import SubMenu from "../components/SubMenu";

export const Menu = () => {
  const { permissions } = usePermissions();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <RAMenu>
      <RAMenu.DashboardItem />
      <RAMenu.Item
        to="/profile"
        primaryText="Profile"
        leftIcon={<AccountCircle />}
      />
      {permissions === "admin" && (
        <SubMenu
          handleToggle={handleToggle}
          isOpen={open}
          name="Management"
          icon={<Settings />}
        >
          <RAMenu.Item
            to="/user-management"
            primaryText="User Management"
            leftIcon={<People />}
          />
          <RAMenu.Item
            to="/system-management"
            primaryText="System Management"
            leftIcon={<Settings />}
          />
        </SubMenu>
      )}
    </RAMenu>
  );
};
