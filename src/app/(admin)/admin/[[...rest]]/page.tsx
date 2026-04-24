import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/modules/admin/AdminApp"), {
  ssr: false,
});

export default function AdminPage() {
  return <AdminApp />;
}
