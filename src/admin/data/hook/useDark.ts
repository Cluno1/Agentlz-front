import { useTheme } from "@mui/material/styles";
import { useStore } from "react-admin";

export const useDarkMode = () => {
  const muiTheme = useTheme();
  const [, setPreferredTheme] = useStore<string>("theme");
  const isDark = muiTheme.palette.mode === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const cardColorStyle = {
    background: isDark ? "#222" : undefined,
    borderColor: isDark ? "#444" : undefined,
  };

  const setDark = (enable: boolean) =>
    setPreferredTheme(enable ? "dark" : "light");
  return { isDark, setDark, textColor, cardColorStyle };
};
