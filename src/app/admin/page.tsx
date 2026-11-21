import AdminDashboard from "./_dashboard";
import { StoreStatusToggle } from "./_components/StoreStatusToggle";

export default function AdminPage() {
  return (
    <>
      <StoreStatusToggle />
      <AdminDashboard />
    </>
  );
}