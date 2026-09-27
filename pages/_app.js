import { AuthProvider, useAuth } from "../lib/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/globals.css";

function Guard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && router.pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, router.pathname]);

  if (router.pathname === "/login") return children;
  if (loading || !user) return <div className="loading">Chargement…</div>;
  return <Layout>{children}</Layout>;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Guard>
        <Component {...pageProps} />
      </Guard>
    </AuthProvider>
  );
}
