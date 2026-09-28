import "./globals.css";
import Sidebar from "./components/Sidebar";
import SmoothScroll from "./components/SmoothScroll";
import RouteFade from "./components/RouteFade";
import AmbientMesh from "./components/AmbientMesh";
import { ThemeProvider, THEME_BOOT_SCRIPT } from "./lib/theme-context";
import { RangeProvider } from "./lib/range-context";
import { PageScopeProvider } from "./lib/page-scope-context";
import { DashboardLayoutProvider } from "./lib/dashboard-layout-context";

export const metadata = {
  title: "Signalboard — Meta Page CRM",
  description: "Live observability layer over your Facebook & Instagram automations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the theme class before first paint to avoid a light/dark flash.
            Sourced from the constant above (never from user input) — this is
            the standard theme-boot exception, not a general-purpose HTML sink. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-body bg-void text-ink">
        <ThemeProvider>
          <RangeProvider>
            <PageScopeProvider>
              <DashboardLayoutProvider>
              <SmoothScroll>
                <AmbientMesh />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 min-h-screen relative">
                    <RouteFade>{children}</RouteFade>
                  </main>
                </div>
              </SmoothScroll>
              </DashboardLayoutProvider>
            </PageScopeProvider>
          </RangeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
