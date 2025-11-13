import {
  AppBar as RAAppBar,
  useGetIdentity,
  useLogout,
  useTranslate,
} from "react-admin";
import { useNavigate } from "react-router-dom";
import { Avatar, Dropdown, Menu } from "@arco-design/web-react";

const ProfileUserButton = () => {
  const { identity } = useGetIdentity();
  const navigate = useNavigate();
  const logout = useLogout();
  const translate = useTranslate();

  const droplist = (
    <Menu
      onClickMenuItem={(key) => {
        if (key === "profile") navigate("/profile");
        if (key === "logout") logout();
      }}
    >
      <Menu.Item key="profile">{translate("menu.profile")}</Menu.Item>
      <Menu.Item key="logout">{translate("menu.logout")}</Menu.Item>
    </Menu>
  );

  return (
    <Dropdown droplist={droplist} position="br" trigger="click">
      <Avatar size={40}>
        <img
          src={identity?.avatar}
          alt={identity?.fullName || translate("menu.profile")}
        />
      </Avatar>
      <span style={{ marginLeft: 8 }}>
        {identity?.fullName || translate("menu.profile")}
      </span>
    </Dropdown>
  );
};

export const AppBar = () => {
  return <RAAppBar userMenu={<ProfileUserButton />}></RAAppBar>;
};
