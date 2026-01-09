import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { AGIChatProvider } from './contexts/AGIChatContext';
import { BookingProvider } from './contexts/BookingContext';
import { PreCheckInProvider } from './contexts/PreCheckInContext';
import { GuestAIProvider } from './contexts/GuestAIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AGIChatWidget } from './components/chatbot/AGIChatWidget';

// Wrapper component to conditionally show Aria AI Chat Widget only on guest pages
function AriaChatWidgetWrapper() {
  const location = useLocation();

  // Hide chat widget on admin and staff portal pages
  const isAdminOrStaffRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  if (isAdminOrStaffRoute) {
    return null;
  }

  return <AGIChatWidget />;
}
import { HomePage } from './pages/Home';
import { LoginPage } from './pages/Auth/LoginPage';
import { SignupPage } from './pages/Auth/SignupPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { RoomsPage } from './pages/Rooms/RoomsPage';
import { RoomDetailPage } from './pages/Rooms/RoomDetailPage';
import { ContactPage } from './pages/Contact/ContactPage';
import { BookingPage } from './pages/Booking/BookingPage';
import { BookingReview } from './pages/Booking/BookingReview';
// Lazy load components to avoid blocking initial load
import { lazy, Suspense } from 'react';
const BookingPayment = lazy(() => import('./pages/Booking/BookingPayment').then(module => ({ default: module.BookingPayment })));
import { BookingConfirmation } from './pages/Booking/BookingConfirmation';
import { BookingFailed } from './pages/Booking/BookingFailed';
import { FeedbackPage } from './pages/Feedback/FeedbackPage';
import { PreCheckInPage } from './pages/PreCheckIn/PreCheckInPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { FrontDeskDashboard } from './pages/Dashboard/FrontDeskDashboard';
import { HousekeepingDashboard } from './pages/Dashboard/HousekeepingDashboard';
import { FinanceDashboard } from './pages/Dashboard/FinanceDashboard';
import { NotFound } from './pages/NotFound/NotFound';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { AdminProvider } from './contexts/AdminContext';
import { CBSProvider } from './context/CBSContext';
import { ChannelManagerProvider } from './context/ChannelManagerContext';
import { RMSProvider } from './context/RMSContext';
import { AIInsightsProvider } from './context/AIInsightsContext';
import AdminLayout from './layouts/AdminLayout';
import { StaffPortalProvider } from './contexts/staff-portal/StaffPortalContext';
import StaffLayout from './layouts/staff-portal/StaffLayout';
import ProtectedRouteStaff from './components/staff-portal/ProtectedRoute';
// Lazy load admin pages to avoid blocking initial load
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Bookings = lazy(() => import('./pages/admin/Bookings'));
const Guests = lazy(() => import('./pages/admin/Guests'));
const GuestProfile = lazy(() => import('./pages/admin/guest/GuestProfile'));
const Rooms = lazy(() => import('./pages/admin/Rooms'));
const Staff = lazy(() => import('./pages/admin/Staff'));
const StaffProfile = lazy(() => import('./pages/admin/staff/StaffProfile'));
const Housekeeping = lazy(() => import('./pages/admin/Housekeeping'));
const Maintenance = lazy(() => import('./pages/admin/Maintenance'));
const Runner = lazy(() => import('./pages/admin/Runner'));
const RevenueAI = lazy(() => import('./pages/admin/RevenueAI'));
const ReputationAI = lazy(() => import('./pages/admin/ReputationAI'));
const CRM = lazy(() => import('./pages/admin/CRM'));
const CRMAI = lazy(() => import('./pages/admin/ai/CRMAI'));
const CRMAIDashboard = lazy(() => import('./pages/admin/ai/CRMAIDashboard'));
const ABTestingDashboard = lazy(() => import('./pages/admin/ai/ABTestingDashboard'));
const OTAConversionCenter = lazy(() => import('./pages/admin/ai/OTAConversionCenter'));
const MemberTierManagement = lazy(() => import('./pages/admin/ai/MemberTierManagement'));
const AISegmentationStudio = lazy(() => import('./pages/admin/ai/AISegmentationStudio'));
const RecoveryActionCenter = lazy(() => import('./pages/admin/ai/RecoveryActionCenter'));
const SegmentDetailsWrapper = lazy(() => import('./pages/admin/crm/SegmentDetailsWrapper'));
const SettingsLayout = lazy(() => import('./pages/admin/settings/SettingsLayout'));
const ReportsHome = lazy(() => import('./pages/admin/ReportsHome'));
const BookingsOccupancyReport = lazy(() => import('./pages/admin/BookingsOccupancyReport'));
const HousekeepingRoomsReport = lazy(() => import('./pages/admin/HousekeepingRoomsReport'));
const RevenueSnapshotReport = lazy(() => import('./pages/admin/RevenueSnapshotReport'));
const GuestExperienceReport = lazy(() => import('./pages/admin/GuestExperienceReport'));
const AdvancedAnalytics = lazy(() => import('./pages/admin/AdvancedAnalytics'));
const Profile = lazy(() => import('./pages/admin/Profile'));


// CMS Pages
// const CMSAvailability = lazy(() => import('./pages/admin/cms/Availability'));
// const CMSBookings = lazy(() => import('./pages/admin/cms/Bookings'));
// const CMSRatePlans = lazy(() => import('./pages/admin/cbs/RatePlans'));
// const CMSPromotions = lazy(() => import('./pages/admin/cbs/Promotions'));


//Modified CMS pages as its in UI codebase
const CMSBookings= lazy(() => import('./pages/admin/cbs/Bookings'));
const CMSAvailability= lazy(() => import('./pages/admin/cbs/Calendar'));
const CMSRatePlans= lazy(() => import('./pages/admin/cbs/RatePlans'));
const CMSPromotions= lazy(() => import('./pages/admin/cbs/Promotions'));
const PromationAnalytics= lazy(() => import('./pages/cms/promotions/Analytics')); 

// Channel Manager Pages
const ChannelDashboard = lazy(() => import('./pages/admin/channel-manager/ChannelDashboard'));
const OTAConnections = lazy(() => import('./pages/admin/channel-manager/OTAConnections'));
const RoomMapping = lazy(() => import('./pages/admin/channel-manager/RoomMapping'));
const RateSync = lazy(() => import('./pages/admin/channel-manager/RateSync'));
const Restrictions = lazy(() => import('./pages/admin/channel-manager/Restrictions'));
const ChannelPromotions = lazy(() => import('./pages/admin/channel-manager/Promotions'));
const SyncLogs = lazy(() => import('./pages/admin/channel-manager/SyncLogs'));
// RMS Pages
const RMSDashboard = lazy(() => import('./pages/admin/rms/RMSDashboard'));
// Revenue Management Pages
const RevenueDashboard = lazy(() => import('./pages/admin/revenue-management/RevenueDashboard'));
const RateCalendar = lazy(() => import('./pages/admin/revenue-management/RateCalendar'));
const DemandForecast = lazy(() => import('./pages/admin/revenue-management/DemandForecast'));
const PickupAnalysis = lazy(() => import('./pages/admin/revenue-management/PickupAnalysis'));
const CompetitorRates = lazy(() => import('./pages/admin/revenue-management/CompetitorRates'));
const Segmentation = lazy(() => import('./pages/admin/revenue-management/Segmentation'));
const PricingRules = lazy(() => import('./pages/admin/revenue-management/PricingRules'));
// Placeholder for pages under construction
const PlaceholderPage = lazy(() => import('./pages/admin/PlaceholderPage'));
// Lazy load staff portal pages
const StaffLogin = lazy(() => import('./pages/staff-portal/Login'));
const StaffHousekeepingDashboard = lazy(() => import('./pages/staff-portal/housekeeping/Dashboard'));
const StaffHousekeepingRooms = lazy(() => import('./pages/staff-portal/housekeeping/Rooms'));
const StaffHousekeepingRoomDetails = lazy(() => import('./pages/staff-portal/housekeeping/RoomDetails'));
const StaffHousekeepingTasks = lazy(() => import('./pages/staff-portal/housekeeping/Tasks'));
const StaffMaintenanceDashboard = lazy(() => import('./pages/staff-portal/maintenance/Dashboard'));
const StaffMaintenanceWorkOrders = lazy(() => import('./pages/staff-portal/maintenance/WorkOrders'));
const StaffMaintenanceTasks = lazy(() => import('./pages/staff-portal/maintenance/MaintenanceTasks'));
const StaffMaintenanceEquipmentIssues = lazy(() => import('./pages/staff-portal/maintenance/EquipmentIssues'));
const StaffRunnerDashboard = lazy(() => import('./pages/staff-portal/runner/Dashboard'));
const StaffRunnerPickupRequests = lazy(() => import('./pages/staff-portal/runner/PickupRequests'));
const StaffRunnerDeliveries = lazy(() => import('./pages/staff-portal/runner/Deliveries'));
const StaffPortalProfile = lazy(() => import('./pages/staff-portal/profile/Profile'));
const StaffNotifications = lazy(() => import('./pages/staff-portal/notifications/Notifications'));
const TechnicianSpecializations = lazy(() => import('./pages/admin/TechnicianSpecializations'));
const StaffTaskAcceptance = lazy(() => import('./pages/staff/TaskAcceptance'));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ChatProvider>
            <AGIChatProvider>
              <PreCheckInProvider>
                <BookingProvider>
                  <GuestAIProvider>
                    <Toaster position="top-right" />
                    <AriaChatWidgetWrapper />
                    <CBSProvider>
                    <Routes>
                      {/* Public routes with navbar/footer */}
                      <Route element={<PublicLayout />}>
                        <Route path="/" element={<HomePage />} />

                        {/* Rooms routes */}
                        <Route path="/rooms" element={<RoomsPage />} />
                        <Route path="/rooms/:slug" element={<RoomDetailPage />} />

                        {/* Contact route */}
                        <Route path="/contact" element={<ContactPage />} />

                        {/* Booking flow routes */}
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/booking/review" element={<BookingReview />} />
                        <Route
                          path="/booking/payment"
                          element={
                            <Suspense fallback={
                              <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                                  <p className="text-neutral-600">Loading payment page...</p>
                                </div>
                              </div>
                            }>
                              <BookingPayment />
                            </Suspense>
                          }
                        />
                        <Route path="/booking/confirmation" element={<BookingConfirmation />} />
                        <Route path="/booking/failed" element={<BookingFailed />} />

                        {/* Feedback route (accessible via email link after checkout) */}
                        <Route path="/feedback" element={<FeedbackPage />} />
                      </Route>

                      {/* Protected routes */}
                      <Route element={<PublicLayout />}>
                        <Route
                          path="/pre-checkin"
                          element={
                            <ProtectedRoute>
                              <PreCheckInPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <DashboardPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/frontdesk"
                          element={
                            <ProtectedRoute>
                              <FrontDeskDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/housekeeping"
                          element={
                            <ProtectedRoute>
                              <HousekeepingDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/finance"
                          element={
                            <ProtectedRoute>
                              <FinanceDashboard />
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Admin routes (protected, full page without public layout) */}
                      <Route
                        path="/admin/*"
                        element={
                          // <ProtectedRoute>
                          <ToastProvider>
                            <SettingsProvider>
                              <AdminProvider>
                                  <ChannelManagerProvider>
                                    <AIInsightsProvider>
                                      <RMSProvider>
                                    <Suspense fallback={
                                      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                                          <p className="text-neutral-600">Loading admin panel...</p>
                                        </div>
                                      </div>
                                    }>
                                      <Routes>
                                        <Route element={<AdminLayout />}>
                                          <Route index element={<Dashboard />} />
                                          <Route path="dashboard" element={<Dashboard />} />
                                          <Route path="bookings" element={<Bookings />} />
                                          <Route path="guests" element={<Guests />} />
                                          <Route path="guests/:guestId" element={<GuestProfile />} />
                                          <Route path="rooms" element={<Rooms />} />
                                          <Route path="staff" element={<Staff />} />
                                          <Route path="staff/:staffId" element={<StaffProfile />} />
                                          <Route path="housekeeping" element={<Housekeeping />} />
                                          <Route path="maintenance" element={<Maintenance />} />
                                          <Route path="runner" element={<Runner />} />
                                          <Route path="revenue" element={<RevenueDashboard />} />
                                          <Route path="reputation" element={<ReputationAI />} />
                                          <Route path="crm" element={<CRM />} />
                                          <Route path="crm/segment/:segmentId" element={<SegmentDetailsWrapper />} />
                                          <Route path="reports" element={<ReportsHome />} />
                                          <Route path="reports/bookings-occupancy" element={<BookingsOccupancyReport />} />
                                          <Route path="reports/housekeeping-rooms" element={<HousekeepingRoomsReport />} />
                                          <Route path="reports/revenue-snapshot" element={<RevenueSnapshotReport />} />
                                          <Route path="reports/guest-experience" element={<GuestExperienceReport />} />
                                          <Route path="analytics" element={<AdvancedAnalytics />} />
                                          <Route path="settings/*" element={<SettingsLayout />} />
                                          {/* Profile Route */}
                                          <Route path="profile" element={<Profile />} />
                                          {/* CMS Routes */}
                                          <Route path="cms/availability" element={<CMSAvailability />} />
                                          {/* Channel Manager Routes */}
                                          <Route path="channel-manager" element={<ChannelDashboard />} />
                                          {/* RMS Routes */}
                                          <Route path="rms" element={<Navigate to="/admin/revenue" replace />} />
                                          {/* CMS Routes */}
                                          <Route path="cms/bookings" element={<CMSBookings />} />
                                          <Route path="cms/rate-plans" element={<CMSRatePlans />} />
                                          <Route path="cms/promotions" element={<CMSPromotions />} />
                                          {/* Channel Manager Routes */}
                                          <Route path="channel-manager/ota" element={<OTAConnections />} />
                                          <Route path="channel-manager/mapping" element={<RoomMapping />} />
                                          <Route path="channel-manager/rate-sync" element={<RateSync />} />
                                          <Route path="channel-manager/restrictions" element={<Restrictions />} />
                                          <Route path="channel-manager/promotions" element={<ChannelPromotions />} />
                                          <Route path="channel-manager/logs" element={<SyncLogs />} />
                                          {/* Revenue Management Routes */}
                                          <Route path="revenue/calendar" element={<RateCalendar />} />
                                          <Route path="revenue/pickup" element={<PickupAnalysis />} />
                                          <Route path="revenue/forecast" element={<DemandForecast />} />
                                          <Route path="revenue/competitors" element={<CompetitorRates />} />
                                          <Route path="revenue/segments" element={<Segmentation />} />
                                          <Route path="revenue/pricing" element={<PricingRules />} />
                                          <Route path="revenue/ai" element={<RevenueAI />} />
                                          {/* AI Routes */}
                                          <Route path="ai/reputation" element={<ReputationAI />} />
                                          <Route path="ai/crm" element={<CRM />} />
                                          <Route path="ai/crm-dashboard" element={<CRMAIDashboard />} />
                                          <Route path="ai/crm-chat" element={<CRMAI />} />
                                          <Route path="ai/ab-testing" element={<ABTestingDashboard />} />
                                          <Route path="ai/ota-conversion" element={<OTAConversionCenter />} />
                                          <Route path="ai/member-tiers" element={<MemberTierManagement />} />
                                          <Route path="ai/ai-segments" element={<AISegmentationStudio />} />
                                          <Route path="ai/recovery" element={<RecoveryActionCenter />} />
                                          {/* Maintenance Specializations */}
                                          <Route path="maintenance/specializations" element={<TechnicianSpecializations />} />
                                        </Route>
                                      </Routes>
                                    </Suspense>
                                      </RMSProvider>
                                    </AIInsightsProvider>
                                  </ChannelManagerProvider>
                              </AdminProvider>
                            </SettingsProvider>
                          </ToastProvider>
                          // </ProtectedRoute>
                        }
                      />

                      {/* Staff Portal routes (protected, with StaffPortalProvider) */}
                      <Route
                        path="/staff/*"
                        element={
                          <StaffPortalProvider>
                            <Suspense fallback={
                              <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                                  <p className="text-neutral-600">Loading staff portal...</p>
                                </div>
                              </div>
                            }>
                              <Routes>
                                <Route path="login" element={<StaffLogin />} />
                                <Route
                                  path="*"
                                  element={
                                    <ProtectedRouteStaff>
                                      <StaffLayout>
                                        <Routes>
                                          {/* Housekeeping routes */}
                                          <Route path="housekeeping" element={<StaffHousekeepingDashboard />} />
                                          <Route path="housekeeping/dashboard" element={<StaffHousekeepingDashboard />} />
                                          <Route path="housekeeping/rooms" element={<StaffHousekeepingRooms />} />
                                          <Route path="housekeeping/rooms/:id" element={<StaffHousekeepingRoomDetails />} />
                                          <Route path="housekeeping/tasks" element={<StaffHousekeepingTasks />} />
                                          <Route path="housekeeping/notifications" element={<StaffNotifications />} />
                                          <Route path="housekeeping/profile" element={<StaffPortalProfile />} />

                                          {/* Maintenance routes */}
                                          <Route path="maintenance" element={<StaffMaintenanceDashboard />} />
                                          <Route path="maintenance/dashboard" element={<StaffMaintenanceDashboard />} />
                                          <Route path="maintenance/work-orders" element={<StaffMaintenanceWorkOrders />} />
                                          <Route path="maintenance/work-orders/:id" element={<StaffMaintenanceWorkOrders />} />
                                          <Route path="maintenance/tasks" element={<StaffMaintenanceTasks />} />
                                          <Route path="maintenance/equipment" element={<StaffMaintenanceEquipmentIssues />} />
                                          <Route path="maintenance/notifications" element={<StaffNotifications />} />
                                          <Route path="maintenance/profile" element={<StaffPortalProfile />} />

                                          {/* Runner routes */}
                                          <Route path="runner" element={<StaffRunnerDashboard />} />
                                          <Route path="runner/dashboard" element={<StaffRunnerDashboard />} />
                                          <Route path="runner/pickups" element={<StaffRunnerPickupRequests />} />
                                          <Route path="runner/deliveries" element={<StaffRunnerDeliveries />} />
                                          <Route path="runner/notifications" element={<StaffNotifications />} />
                                          <Route path="runner/profile" element={<StaffPortalProfile />} />

                                          {/* Task Acceptance (for force-assigned tasks) */}
                                          <Route path="tasks/pending" element={<StaffTaskAcceptance />} />

                                          {/* Common routes (accessible from any role) */}
                                          <Route path="profile" element={<StaffPortalProfile />} />
                                          <Route path="notifications" element={<StaffNotifications />} />

                                          {/* Default redirect based on role */}
                                          <Route index element={<StaffHousekeepingDashboard />} />
                                        </Routes>
                                      </StaffLayout>
                                    </ProtectedRouteStaff>
                                  }
                                />
                              </Routes>
                            </Suspense>
                          </StaffPortalProvider>
                        }
                      />

                      {/* Auth routes (full page) */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </CBSProvider>
                  </GuestAIProvider>
                </BookingProvider>
              </PreCheckInProvider>
            </AGIChatProvider>
          </ChatProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
