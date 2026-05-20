import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { useMatches } from "@/hooks/useMatches";
import { useLivePolling } from "@/hooks/useLivePolling";
import styles from "./Layout.module.css";

export function Layout() {
  const matchesRes = useMatches();
  useLivePolling(matchesRes.status === "ready" ? matchesRes.data : undefined);

  return (
    <div className={styles.layout}>
      <Header />
      <Navigation />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
