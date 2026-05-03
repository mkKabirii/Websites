import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import AOSInit from "./components/AOSInit";
import "aos/dist/aos.css";
import BackToTop from "./components/backToTop";
import ConditionalChatButton from "./components/ConditionalChatButton";
import CursorSpotlight from "./components/CursorSpotlight";
import CustomCursor from "./components/CustomCursor";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WGTECSOL (Pvt.) Ltd.",
  description:
    "WGTECSOL (Pvt.) Ltd. is a leading technology company that provides innovative solutions to businesses.",
  icons: {
    icon: "/images/WGTecSol_About.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body id="top" className={`${barlow.className} bg-black`}>
        <CustomCursor />
        <CursorSpotlight />
        <Navbar />
        <AOSInit />
        {children}
        <BackToTop />
        <ConditionalChatButton />
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </body>
    </html>
  );
}
