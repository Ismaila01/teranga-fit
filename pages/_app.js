import { AuthProvider, useAuth } from "../lib/auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/globals.css";

function Guard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isPublic = router.pathname === "/login" || router.pathname.startsWith("/ticket");

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, router.pathname]);

  if (isPublic) return children;
  if (loading || !user) return <div className="loading">Chargement…</div>;
  return <Layout>{children}</Layout>;
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        <title>Teranga Fit — Gestion de salle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FF4438" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Teranga Fit" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>
      <AuthProvider>
        <Guard>
          <Component {...pageProps} />
        </Guard>
      </AuthProvider>
    </>
  );
}
