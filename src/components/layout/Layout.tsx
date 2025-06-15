import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import MobileNavigation from "./MobileNavigation.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ErrorBoundary from "../error/ErrorBoundary.tsx";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Pages that should not display header/footer
  const isAuthPage = ["/login", "/auth/google"].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Header />}
      <ErrorBoundary>
        <main className="h-full pb-16 md:pb-0">{children}</main>
      </ErrorBoundary>
      {!isAuthPage && (
        <>
          <MobileNavigation />
          <Footer />
        </>
      )}
    </>
  );
};

export default Layout;
