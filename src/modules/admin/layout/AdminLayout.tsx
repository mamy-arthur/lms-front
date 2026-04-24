import { Layout, LayoutProps } from "react-admin";
import { CustomMenu } from "./menu/CustomMenu";
import { CustomAppBar } from "./partial/CustomAppBar";

export function AdminLayout(props: LayoutProps) {
  return <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />;
}
