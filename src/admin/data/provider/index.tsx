import formProvider from "./formProvider";
import { DataProvider } from "react-admin";
export const dataProvider: DataProvider = {
  ...formProvider,
};
