import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { AdminRoute } from "@/components/common/AdminRoute";
import { Loader } from "@/components/common/Loader";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ROUTE_ALIASES } from "@/layouts/navigation";
import { PublicLayout } from "@/layouts/PublicLayout";

// Route-based code splitting: every page — and the signed-in app shell itself — is its own
// chunk, so a first visit to the public home page downloads no dashboard, map or chart code.
const MainLayout = lazy(() => import("@/layouts/MainLayout").then((m) => ({ default: m.MainLayout })));
const AuthLayout = lazy(() => import("@/layouts/AuthLayout").then((m) => ({ default: m.AuthLayout })));

// Public website
const HomePage = lazy(() => import("@/pages/HomePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const FeaturesPage = lazy(() => import("@/pages/site/FeaturesPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
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
const TermsPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.TermsPage })));
const DisclaimerPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.DisclaimerPage })));
const ImageCreditsPage = lazy(() => import("@/pages/site/LegalPages").then((m) => ({ default: m.ImageCreditsPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Account
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

// Signed-in app
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const DataDashboardPage = lazy(() => import("@/pages/DataDashboardPage"));
const LocalIntelligencePage = lazy(() => import("@/pages/LocalIntelligencePage"));
const RecommendPage = lazy(() => import("@/pages/RecommendPage"));
const SeasonalAdvisorPage = lazy(() => import("@/pages/SeasonalAdvisorPage"));
const RotationPlannerPage = lazy(() => import("@/pages/RotationPlannerPage"));
const PlannerPage = lazy(() => import("@/pages/PlannerPage"));
const SoilAnalysisPage = lazy(() => import("@/pages/SoilAnalysisPage"));
const FertilizerPage = lazy(() => import("@/pages/FertilizerPage"));
const IrrigationPage = lazy(() => import("@/pages/IrrigationPage"));
const DiseaseDetectionPage = lazy(() => import("@/pages/DiseaseDetectionPage"));
const WeatherPage = lazy(() => import("@/pages/WeatherPage"));
const YieldPredictionPage = lazy(() => import("@/pages/YieldPredictionPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const InsightsPage = lazy(() => import("@/pages/InsightsPage"));
const CropsPage = lazy(() => import("@/pages/CropsPage"));
const CropDetailPage = lazy(() => import("@/pages/CropDetailPage"));
const CropGalleryPage = lazy(() => import("@/pages/CropGalleryPage"));
const StatesPage = lazy(() => import("@/pages/StatesPage"));
const SoilTypesPage = lazy(() => import("@/pages/SoilTypesPage"));
const KnowledgePage = lazy(() => import("@/pages/KnowledgePage"));
const FarmsPage = lazy(() => import("@/pages/FarmsPage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

/** Old short URL -> canonical page, keeping any ?query and #hash. */
function Redirect({ to }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

/** Signed-in app routes: [path, element]. All need an account (the API enforces this too). */
const APP_ROUTES = [
  ["dashboard", <DashboardPage key="d" />],
  ["data-dashboard", <DataDashboardPage key="dd" />],
  ["local-intelligence", <LocalIntelligencePage key="li" />],
  ["crop-recommendation", <RecommendPage key="cr" />],
  ["seasonal-advisor", <SeasonalAdvisorPage key="sa" />],
  ["rotation-planner", <RotationPlannerPage key="rp" />],
  ["planner", <PlannerPage key="pl" />],
  ["soil-analysis", <SoilAnalysisPage key="so" />],
  ["fertilizer", <FertilizerPage key="fe" />],
  ["irrigation-optimization", <IrrigationPage key="ir" />],
  ["disease-detection", <DiseaseDetectionPage key="di" />],
  ["weather", <WeatherPage key="we" />],
  ["yield-prediction", <YieldPredictionPage key="yp" />],
  ["reports", <ReportsPage key="re" />],
  ["insights", <InsightsPage key="in" />],
  ["crops", <CropsPage key="cp" />],
  ["crops/:name", <CropDetailPage key="cd" />],
  ["crop-gallery", <CropGalleryPage key="cg" />],
  ["states", <StatesPage key="st" />],
  ["soil-types", <SoilTypesPage key="sl" />],
  ["learn", <KnowledgePage key="le" />],
  ["farms", <FarmsPage key="fa" />],
  ["assistant", <AssistantPage key="as" />],
  ["settings", <SettingsPage key="se" />],
];

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="route-fallback">
          <Loader label="Loading" />
        </div>
      }
    >
      <Routes>
        {/* Public website — no sign-in, no internal tools or sidebar. */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="ai-in-agriculture" element={<AiSolutionsPage />} />
          <Route path="agricultural-production-systems" element={<AgriculturePage />} />
          <Route path="agricultural-production-systems/:slug" element={<ProductionSystemPage />} />
          <Route path="smart-agricultural-machines" element={<MachinesPage />} />
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
          <Route path="terms" element={<TermsPage />} />
          <Route path="disclaimer" element={<DisclaimerPage />} />
          <Route path="image-credits" element={<ImageCreditsPage />} />
          {Object.entries(ROUTE_ALIASES).map(([from, to]) => (
            <Route key={from} path={from} element={<Redirect to={to} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Account screens */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Signed-in app: sidebar, dashboard and every tool. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {APP_ROUTES.map(([path, element]) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route element={<MainLayout />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
