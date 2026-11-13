import { lazy } from "react";
import { Route, Routes } from "react-router";

import { AdminRoute } from "@/components/common/AdminRoute";
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
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const YieldPredictionPage = lazy(() => import("@/pages/YieldPredictionPage"));
const SoilAnalysisPage = lazy(() => import("@/pages/SoilAnalysisPage"));
const SoilTypesPage = lazy(() => import("@/pages/SoilTypesPage"));
const WeatherPage = lazy(() => import("@/pages/WeatherPage"));
const IrrigationPage = lazy(() => import("@/pages/IrrigationPage"));
const DiseaseDetectionPage = lazy(() => import("@/pages/DiseaseDetectionPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const StatesPage = lazy(() => import("@/pages/StatesPage"));
const CropGalleryPage = lazy(() => import("@/pages/CropGalleryPage"));
const SeasonalAdvisorPage = lazy(() => import("@/pages/SeasonalAdvisorPage"));
const RotationPlannerPage = lazy(() => import("@/pages/RotationPlannerPage"));
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="yield" element={<YieldPredictionPage />} />
        <Route path="yield-prediction" element={<YieldPredictionPage />} />
        <Route path="soil" element={<SoilAnalysisPage />} />
        <Route path="soil-analysis" element={<SoilAnalysisPage />} />
        <Route path="soil-types" element={<SoilTypesPage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="irrigation" element={<IrrigationPage />} />
        <Route path="irrigation-optimization" element={<IrrigationPage />} />
        <Route path="disease" element={<DiseaseDetectionPage />} />
        <Route path="disease-detection" element={<DiseaseDetectionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="states" element={<StatesPage />} />
        <Route path="crop-gallery" element={<CropGalleryPage />} />
        <Route path="seasonal-advisor" element={<SeasonalAdvisorPage />} />
        <Route path="rotation-planner" element={<RotationPlannerPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />

        {/* Works signed out (saved on the device); signed-in users sync to the farm-service. */}
        <Route path="farms" element={<FarmsPage />} />

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
