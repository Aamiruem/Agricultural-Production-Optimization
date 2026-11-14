import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { AdminRoute } from "@/components/common/AdminRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { ROUTE_ALIASES } from "@/layouts/navigation";

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
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const YieldPredictionPage = lazy(() => import("@/pages/YieldPredictionPage"));
const SoilAnalysisPage = lazy(() => import("@/pages/SoilAnalysisPage"));
const SoilTypesPage = lazy(() => import("@/pages/SoilTypesPage"));
const WeatherPage = lazy(() => import("@/pages/WeatherPage"));
const IrrigationPage = lazy(() => import("@/pages/IrrigationPage"));
const DiseaseDetectionPage = lazy(() => import("@/pages/DiseaseDetectionPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const StatesPage = lazy(() => import("@/pages/StatesPage"));
const DataDashboardPage = lazy(() => import("@/pages/DataDashboardPage"));
const CropGalleryPage = lazy(() => import("@/pages/CropGalleryPage"));
const SeasonalAdvisorPage = lazy(() => import("@/pages/SeasonalAdvisorPage"));
const RotationPlannerPage = lazy(() => import("@/pages/RotationPlannerPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const KnowledgePage = lazy(() => import("@/pages/KnowledgePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

/** Old short URL -> canonical page, keeping any ?query and #hash. */
function Redirect({ to }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Home */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="data-dashboard" element={<DataDashboardPage />} />

        {/* Plan */}
        <Route path="crop-recommendation" element={<RecommendPage />} />
        <Route path="seasonal-advisor" element={<SeasonalAdvisorPage />} />
        <Route path="rotation-planner" element={<RotationPlannerPage />} />
        <Route path="planner" element={<PlannerPage />} />

        {/* Grow */}
        <Route path="soil-analysis" element={<SoilAnalysisPage />} />
        <Route path="fertilizer" element={<FertilizerPage />} />
        <Route path="irrigation-optimization" element={<IrrigationPage />} />
        <Route path="disease-detection" element={<DiseaseDetectionPage />} />
        <Route path="weather" element={<WeatherPage />} />

        {/* Analyse */}
        <Route path="yield-prediction" element={<YieldPredictionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="insights" element={<InsightsPage />} />

        {/* Explore India */}
        <Route path="crops" element={<CropsPage />} />
        <Route path="crops/:name" element={<CropDetailPage />} />
        <Route path="crop-gallery" element={<CropGalleryPage />} />
        <Route path="states" element={<StatesPage />} />
        <Route path="soil-types" element={<SoilTypesPage />} />
        <Route path="learn" element={<KnowledgePage />} />

        {/* My farm — works signed out (saved on the device); signed-in users sync to the farm-service. */}
        <Route path="farms" element={<FarmsPage />} />
        <Route path="assistant" element={<AssistantPage />} />

        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />

        {/* RBAC: admins only */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        {Object.entries(ROUTE_ALIASES).map(([from, to]) => <Route key={from} path={from} element={<Redirect to={to} />} />)}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
