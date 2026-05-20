import React, { useEffect } from "react";
import { ConfigProvider } from "@arco-design/web-react";
import { useLocale } from "react-admin";
import { useTheme } from "@mui/material/styles";
import zhCN from "@arco-design/web-react/es/locale/zh-CN";
import enUS from "@arco-design/web-react/es/locale/en-US";

export const ArcoLocaleBridge = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
