import { AppBar, TitlePortal } from "react-admin";
import { Brand } from "./Brand";

export function CustomAppBar() {
  return (
    <AppBar>
      <Brand />
      <TitlePortal />
    </AppBar>
  );
}
