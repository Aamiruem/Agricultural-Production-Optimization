import { lazy } from "react";
import { Route, Routes } from "react-router";

import { AdminRoute } from "@/components/common/AdminRoute";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";

// Route-based code splitting: each page is its own chunk, loaded on demand.
const HomePage = lazy(() => import("@/pages/HomePage"));
const RecommendPage = lazy(() => import("@/pages/RecommendPage"));
const FertilizerPage = lazy(() => import("@/pages/FertilizerPage"));
const CropsPage = lazy(() => import("@/pages/CropsPage"));
const CropDetailPage = lazy(() => import("@/pages/CropDetailPage"));
const PlannerPage = lazy(() => import("@/pages/PlannerPage"));
const FarmsPage = lazy(() => import("@/pages/FarmsPage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage"));
const InsightsPage = lazy(() => import("@/pages/InsightsPage"));
const IndiaToolsPage = lazy(() => import("@/pages/IndiaToolsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<RecommendPage />} />
        <Route path="crop-recommendation" element={<RecommendPage />} />
        <Route path="fertilizer" element={<FertilizerPage />} />
        <Route path="crops" element={<CropsPage />} />
        <Route path="crops/:name" element={<CropDetailPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="dashboard" element={<IndiaToolsPage page="dashboard" />} />
        <Route path="yield" element={<IndiaToolsPage page="yield" />} />
        <Route path="yield-prediction" element={<IndiaToolsPage page="yield" />} />
        <Route path="soil" element={<IndiaToolsPage page="soil" />} />
        <Route path="soil-analysis" element={<IndiaToolsPage page="soil" />} />
        <Route path="weather" element={<IndiaToolsPage page="weather" />} />
        <Route path="irrigation" element={<IndiaToolsPage page="irrigation" />} />
        <Route path="irrigation-optimization" element={<IndiaToolsPage page="irrigation" />} />
        <Route path="disease" element={<IndiaToolsPage page="disease" />} />
        <Route path="disease-detection" element={<IndiaToolsPage page="disease" />} />
        <Route path="reports" element={<IndiaToolsPage page="reports" />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />

        {/* Signed-in users only */}
        <Route element={<ProtectedRoute />}>
          <Route path="farms" element={<FarmsPage />} />
        </Route>

        {/* RBAC: admins only */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
