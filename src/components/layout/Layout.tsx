import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  showNavbar?: boolean;
  showFooter?: boolean;
  children?: React.ReactNode;
}

const Layout = ({ showNavbar = true, showFooter = true, children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
