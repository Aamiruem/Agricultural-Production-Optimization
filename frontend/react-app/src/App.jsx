import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

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
const KnowledgePage = lazy(() => import("@/pages/KnowledgePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Content pages (public information hub)
const AgriculturePage = lazy(() => import("@/pages/site/AgriculturePage"));
const ProductionSystemPage = lazy(() => import("@/pages/site/ProductionSystemPage"));
const MachinesPage = lazy(() => import("@/pages/site/MachinesPage"));
const AiSolutionsPage = lazy(() => import("@/pages/site/AiSolutionsPage"));
const CropsFoodPage = lazy(() => import("@/pages/site/CropsFoodPage"));
const HealthPage = lazy(() => import("@/pages/site/HealthPage"));
const NutritionPage = lazy(() => import("@/pages/site/NutritionPage"));
const EducationPage = lazy(() => import("@/pages/site/EducationPage"));
const ServicesPage = lazy(() => import("@/pages/site/ServicesPage"));
const ProjectsPage = lazy(() => import("@/pages/site/ProjectsPage"));
const DeveloperPage = lazy(() => import("@/pages/site/DeveloperPage"));
const AppPage = lazy(() => import("@/pages/site/AppPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.PrivacyPolicyPage })));
const DisclaimerPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.DisclaimerPage })));
const ImageCreditsPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.ImageCreditsPage })));

/** Old short URL -> canonical page, keeping any ?query and #hash. */
function Redirect({ to }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

// No login, registration or account pages: every page is public.
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />

        {/* Information hub */}
        <Route path="about" element={<AboutPage />} />
        <Route path="agricultural-production-systems" element={<AgriculturePage />} />
        <Route path="agricultural-production-systems/:slug" element={<ProductionSystemPage />} />
        <Route path="smart-agricultural-machines" element={<MachinesPage />} />
        <Route path="ai-in-agriculture" element={<AiSolutionsPage />} />
        <Route path="crops-and-food" element={<CropsFoodPage />} />
        <Route path="farmer-health" element={<HealthPage />} />
        <Route path="food-and-nutrition" element={<NutritionPage />} />
        <Route path="farmer-education" element={<EducationPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="developer" element={<DeveloperPage />} />
        <Route path="app" element={<AppPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="disclaimer" element={<DisclaimerPage />} />
        <Route path="image-credits" element={<ImageCreditsPage />} />

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

        {/* My farm — saved on this device, no account needed. */}
        <Route path="farms" element={<FarmsPage />} />
        <Route path="assistant" element={<AssistantPage />} />

        {Object.entries(ROUTE_ALIASES).map(([from, to]) => (
          <Route key={from} path={from} element={<Redirect to={to} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
