import { AppBar as RAAppBar, useGetIdentity, useLogout } from "react-admin";
import { Button } from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Dropdown, Menu } from "@arco-design/web-react";

const ProfileUserButton = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const logout = useLogout();

  const droplist = (
    <Menu
      onClickMenuItem={(key) => {
        if (key === "profile") navigate("/profile");
        if (key === "logout") logout();
      }}
    >
      <Menu.Item key="profile">Profile</Menu.Item>
      <Menu.Item key="logout">Logout</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown droplist={droplist} position="br" trigger="click">
      <Button
        startIcon={<AccountCircle />}
        aria-label="Profile"
        color="inherit"
      >
        {identity?.fullName || "Profile"}
      </Button>
    </Dropdown>
  );
};

export const AppBar = () => {
  return <RAAppBar userMenu={<ProfileUserButton />} />;
};
