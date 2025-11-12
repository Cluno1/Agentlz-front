import { profileProvider } from "./profileProvider";
import formProvider from "./formProvider";
import { DataProvider } from "react-admin";
export const dataProvider: DataProvider = {
  ...profileProvider,
  ...formProvider,
};
