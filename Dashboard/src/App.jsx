import { Component, lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router";

import { Shell } from "@/components/layout/Shell.jsx";
import { Button, EmptyState, ErrorState, Skeleton } from "@/ components/ui/primitives.jsx";

const OverviewPage = lazy(() => import("@/pages/OverviewPage.jsx"));
const StudioPage = lazy(() => import("@/pages/StudioPage.jsx"));
const YieldPage = lazy(() => import("@/pages/YieldPage.jsx"));
const ModelsPage = lazy(() => import("@/pages/ModelsPage.jsx"));
const FarmsPage = lazy(() => import("@/pages/FarmsPage.jsx"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage.jsx"));
const McpPage = lazy(() => import("@/pages/McpPage.jsx"));
const SystemPage = lazy(() => import("@/pages/SystemPage.jsx"));
const LoginPage = lazy(() => import("@/pages/LoginPage.jsx"));

/** Contains a crash to the page that threw; the shell and navigation keep working. */
class PageBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorState
        error={{ message: "This page hit an unexpected error. The rest of the console still works." }}
        onRetry={() => this.setState({ error: null })}
      />
    );
  }
}

function PageFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
      <Skeleton className="h-80 sm:col-span-2 xl:col-span-4" />
    </div>
  );
}

function Page({ children }) {
  const { pathname } = useLocation();
  return (
    <PageBoundary key={pathname}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </PageBoundary>
  );
}

function NotFound() {
  return (
    <EmptyState icon="info" title="Page not found" action={<Link to="/"><Button variant="tonal">Back to overview</Button></Link>}>
      The page you asked for doesn&apos;t exist in the console.
    </EmptyState>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Page><OverviewPage /></Page>} />
        <Route path="studio" element={<Page><StudioPage /></Page>} />
        <Route path="yield" element={<Page><YieldPage /></Page>} />
        <Route path="models" element={<Page><ModelsPage /></Page>} />
        <Route path="farms" element={<Page><FarmsPage /></Page>} />
        <Route path="assistant" element={<Page><AssistantPage /></Page>} />
        <Route path="mcp-tools" element={<Page><McpPage /></Page>} />
        <Route path="system" element={<Page><SystemPage /></Page>} />
        <Route path="login" element={<Page><LoginPage /></Page>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
