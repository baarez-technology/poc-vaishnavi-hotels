import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { AGIChatProvider } from './contexts/AGIChatContext';
import { BookingProvider } from './contexts/BookingContext';
import { PreCheckInProvider } from './contexts/PreCheckInContext';
import { GuestAIProvider } from './contexts/GuestAIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SSEProvider } from './contexts/SSEContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { AGIChatWidget } from './components/chatbot/AGIChatWidget';
import { HotelGuard } from './components/HotelGuard';

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
import SetFirstPassword from './pages/Auth/SetFirstPassword';
import { RoomsPage } from './pages/Rooms/RoomsPage';
import { RoomDetailPage } from './pages/Rooms/RoomDetailPage';
import { ContactPage } from './pages/Contact/ContactPage';
import { AmenitiesPage } from './pages/Amenities/AmenitiesPage';
import { WishlistPage } from './pages/Wishlist/WishlistPage';
import { BookingPage } from './pages/Booking/BookingPage';
import { BookingReview } from './pages/Booking/BookingReview';
// Lazy load components to avoid blocking initial load
import { lazy, Suspense } from 'react';

// Retry wrapper for lazy imports — handles stale chunk hashes after deploys
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((err: any) => {
      // Only reload once per session to avoid infinite loops
      const key = 'chunk_reload_' + importFn.toString().slice(0, 80);
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise(() => {}); // Never resolves — page is reloading
      }
      throw err; // Already retried once, surface the real error
    })
  );
}

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
// Lazy load admin pages with retry to handle stale chunk hashes after deploy
const Dashboard = lazyWithRetry(() => import('./pages/admin/Dashboard'));
const Bookings = lazyWithRetry(() => import('./pages/admin/Bookings'));
const Guests = lazyWithRetry(() => import('./pages/admin/Guests'));
const GuestProfile = lazyWithRetry(() => import('./pages/admin/guest/GuestProfile'));
const Rooms = lazyWithRetry(() => import('./pages/admin/Rooms'));
const Staff = lazyWithRetry(() => import('./pages/admin/Staff'));
const StaffProfile = lazyWithRetry(() => import('./pages/admin/staff/StaffProfile'));
const Housekeeping = lazyWithRetry(() => import('./pages/admin/Housekeeping'));
const Maintenance = lazyWithRetry(() => import('./pages/admin/Maintenance'));
const RevenueAI = lazyWithRetry(() => import('./pages/admin/RevenueAI'));
const ReputationAI = lazyWithRetry(() => import('./pages/admin/ReputationAI'));
const ReputationGoals = lazyWithRetry(() => import('./pages/admin/ReputationGoals'));
const ReputationPendingReviews = lazyWithRetry(() => import('./pages/admin/ReputationPendingReviews'));
const CRM = lazyWithRetry(() => import('./pages/admin/CRM'));
const CRMAI = lazyWithRetry(() => import('./pages/admin/ai/CRMAI'));
const CRMAIDashboard = lazyWithRetry(() => import('./pages/admin/ai/CRMAIDashboard'));
const SegmentDetailsWrapper = lazyWithRetry(() => import('./pages/admin/crm/SegmentDetailsWrapper'));
const SettingsLayout = lazyWithRetry(() => import('./pages/admin/settings/SettingsLayout'));
const ReportsHome = lazyWithRetry(() => import('./pages/admin/ReportsHome'));
const BookingsOccupancyReport = lazyWithRetry(() => import('./pages/admin/BookingsOccupancyReport'));
const HousekeepingRoomsReport = lazyWithRetry(() => import('./pages/admin/HousekeepingRoomsReport'));
const RevenueSnapshotReport = lazyWithRetry(() => import('./pages/admin/RevenueSnapshotReport'));
const GuestExperienceReport = lazyWithRetry(() => import('./pages/admin/GuestExperienceReport'));
const Profile = lazyWithRetry(() => import('./pages/admin/Profile'));
const AccessDenied = lazyWithRetry(() => import('./pages/admin/AccessDenied'));





//Modified CMS pages as its in UI codebase
const CMSBookings = lazyWithRetry(() => import('./pages/admin/cbs/Bookings'));
const CMSAvailability = lazyWithRetry(() => import('./pages/admin/cbs/Calendar'));
const CMSRatePlans = lazyWithRetry(() => import('./pages/admin/cbs/RatePlans'));
const CMSPromotions = lazyWithRetry(() => import('./pages/admin/cbs/Promotions'));
const PromationAnalytics = lazyWithRetry(() => import('./pages/cms/promotions/Analytics'));

// Channel Manager Pages
const ChannelDashboard = lazyWithRetry(() => import('./pages/admin/channel-manager/ChannelDashboard'));
const OTAConnections = lazyWithRetry(() => import('./pages/admin/channel-manager/OTAConnections'));
const RoomMapping = lazyWithRetry(() => import('./pages/admin/channel-manager/RoomMapping'));
const RateSync = lazyWithRetry(() => import('./pages/admin/channel-manager/RateSync'));
const Restrictions = lazyWithRetry(() => import('./pages/admin/channel-manager/Restrictions'));
const ChannelPromotions = lazyWithRetry(() => import('./pages/admin/channel-manager/Promotions'));
const SyncLogs = lazyWithRetry(() => import('./pages/admin/channel-manager/SyncLogs'));
// RMS Pages
const RMSDashboard = lazyWithRetry(() => import('./pages/admin/rms/RMSDashboard'));
// Revenue Management Pages
const RevenueDashboard = lazyWithRetry(() => import('./pages/admin/revenue-management/RevenueDashboard'));
const RateCalendar = lazyWithRetry(() => import('./pages/admin/revenue-management/RateCalendar'));
const DemandForecast = lazyWithRetry(() => import('./pages/admin/revenue-management/DemandForecast'));
const PickupAnalysis = lazyWithRetry(() => import('./pages/admin/revenue-management/PickupAnalysis'));
const CompetitorRates = lazyWithRetry(() => import('./pages/admin/revenue-management/CompetitorRates'));
const Segmentation = lazyWithRetry(() => import('./pages/admin/revenue-management/Segmentation'));
const PricingRules = lazyWithRetry(() => import('./pages/admin/revenue-management/PricingRules'));
const PaymentAnalytics = lazyWithRetry(() => import('./pages/admin/revenue-management/PaymentAnalytics'));
// Placeholder for pages under construction
const PlaceholderPage = lazyWithRetry(() => import('./pages/admin/PlaceholderPage'));
// Lazy load staff portal pages
const StaffLogin = lazyWithRetry(() => import('./pages/staff-portal/Login'));
const StaffHousekeepingDashboard = lazyWithRetry(() => import('./pages/staff-portal/housekeeping/Dashboard'));
const StaffHousekeepingRooms = lazyWithRetry(() => import('./pages/staff-portal/housekeeping/Rooms'));
const StaffHousekeepingRoomDetails = lazyWithRetry(() => import('./pages/staff-portal/housekeeping/RoomDetails'));
const StaffHousekeepingTasks = lazyWithRetry(() => import('./pages/staff-portal/housekeeping/Tasks'));
const StaffMaintenanceDashboard = lazyWithRetry(() => import('./pages/staff-portal/maintenance/Dashboard'));
const StaffMaintenanceWorkOrders = lazyWithRetry(() => import('./pages/staff-portal/maintenance/WorkOrders'));
const StaffMaintenanceTasks = lazyWithRetry(() => import('./pages/staff-portal/maintenance/MaintenanceTasks'));
const StaffMaintenanceEquipmentIssues = lazyWithRetry(() => import('./pages/staff-portal/maintenance/EquipmentIssues'));
const StaffRunnerDashboard = lazyWithRetry(() => import('./pages/staff-portal/runner/Dashboard'));
const StaffRunnerPickupRequests = lazyWithRetry(() => import('./pages/staff-portal/runner/PickupRequests'));
const StaffRunnerDeliveries = lazyWithRetry(() => import('./pages/staff-portal/runner/Deliveries'));
const StaffPortalProfile = lazyWithRetry(() => import('./pages/staff-portal/profile/Profile'));
const StaffNotifications = lazyWithRetry(() => import('./pages/staff-portal/notifications/Notifications'));
const TechnicianSpecializations = lazyWithRetry(() => import('./pages/admin/TechnicianSpecializations'));
const NightAudit = lazyWithRetry(() => import('./pages/admin/NightAudit'));
const CorporateAccounts = lazyWithRetry(() => import('./pages/admin/CorporateAccounts'));
const ARLedger = lazyWithRetry(() => import('./pages/admin/ARLedger'));
const AuditLogs = lazyWithRetry(() => import('./pages/admin/AuditLogs'));
const CashierSessions = lazyWithRetry(() => import('./pages/admin/CashierSessions'));
const RoomMoves = lazyWithRetry(() => import('./pages/admin/RoomMoves'));
const PosClosurePage = lazyWithRetry(() => import('./pages/admin/PosClosurePage'));
const PaymasterAccounts = lazyWithRetry(() => import('./pages/admin/PaymasterAccounts'));
const AuditPackPage = lazyWithRetry(() => import('./pages/admin/AuditPackPage'));
const MultiRoomBooking = lazyWithRetry(() => import('./pages/admin/MultiRoomBooking'));
const TransactionCodes = lazyWithRetry(() => import('./pages/admin/TransactionCodes'));
const PreAuthHolds = lazyWithRetry(() => import('./pages/admin/PreAuthHolds'));
const RateCheckReport = lazyWithRetry(() => import('./pages/admin/RateCheckReport'));
const StaffTaskAcceptance = lazyWithRetry(() => import('./pages/staff/TaskAcceptance'));

function App() {
  return (
    <HotelGuard>
      <ThemeProvider>
        <WishlistProvider>
          <BrandingProvider>
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
                        <SettingsProvider>
                        <Routes>
                          {/* Public routes with navbar/footer */}
                          <Route element={<PublicLayout />}>
                            <Route path="/" element={<HomePage />} />

                            {/* Rooms routes */}
                            <Route path="/rooms" element={<RoomsPage />} />
                            <Route path="/rooms/:slug" element={<RoomDetailPage />} />

                            {/* Amenities route */}
                            <Route path="/amenities" element={<AmenitiesPage />} />

                            {/* Contact route */}
                            <Route path="/contact" element={<ContactPage />} />

                            {/* Wishlist route */}
                            <Route path="/wishlist" element={<WishlistPage />} />

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
                                  <ToastProvider>
                                    <SSEProvider>
                                      <DashboardPage />
                                    </SSEProvider>
                                  </ToastProvider>
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/dashboard/frontdesk"
                              element={
                                <ProtectedRoute>
                                  <ToastProvider>
                                    <SSEProvider>
                                      <FrontDeskDashboard />
                                    </SSEProvider>
                                  </ToastProvider>
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/dashboard/housekeeping"
                              element={
                                <ProtectedRoute>
                                  <ToastProvider>
                                    <SSEProvider>
                                      <HousekeepingDashboard />
                                    </SSEProvider>
                                  </ToastProvider>
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/dashboard/finance"
                              element={
                                <ProtectedRoute>
                                  <ToastProvider>
                                    <SSEProvider>
                                      <FinanceDashboard />
                                    </SSEProvider>
                                  </ToastProvider>
                                </ProtectedRoute>
                              }
                            />
                          </Route>

                          {/* Admin routes (protected, full page without public layout) */}
                          <Route
                            path="/admin/*"
                            element={
                              <ProtectedRoute>
                                <ToastProvider>
                                  <SSEProvider>
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
                                                    <Route path="access-denied" element={<AccessDenied />} />
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
                                                    <Route path="revenue" element={<RevenueDashboard />} />
                                                    <Route path="reputation" element={<ReputationAI />} />
                                                    <Route path="reputation/goals" element={<ReputationGoals />} />
                                                    <Route path="reputation/reviews" element={<ReputationPendingReviews />} />
                                                    <Route path="crm" element={<CRM />} />
                                                    <Route path="crm/segment/:segmentId" element={<SegmentDetailsWrapper />} />
                                                    <Route path="reports" element={<ReportsHome />} />
                                                    <Route path="reports/bookings-occupancy" element={<BookingsOccupancyReport />} />
                                                    <Route path="reports/housekeeping-rooms" element={<HousekeepingRoomsReport />} />
                                                    <Route path="reports/revenue-snapshot" element={<RevenueSnapshotReport />} />
                                                    <Route path="reports/guest-experience" element={<GuestExperienceReport />} />
                                                    <Route path="settings/*" element={<SettingsLayout />} />
                                                    {/* Profile Route */}
                                                    <Route path="profile" element={<Profile />} />
                                                    {/* CMS Routes */}
                                                    <Route path="cms/availability" element={<CMSAvailability />} />
                                                    <Route path="cms/bookings" element={<CMSBookings />} />
                                                    <Route path="cms/rate-plans" element={<CMSRatePlans />} />
                                                    <Route path="cms/promotions" element={<CMSPromotions />} />
                                                    {/* Channel Manager Routes */}
                                                    <Route path="channel-manager" element={<ChannelDashboard />} />
                                                    <Route path="channel-manager/ota" element={<OTAConnections />} />
                                                    <Route path="channel-manager/mapping" element={<RoomMapping />} />
                                                    <Route path="channel-manager/rate-sync" element={<RateSync />} />
                                                    <Route path="channel-manager/restrictions" element={<Restrictions />} />
                                                    <Route path="channel-manager/promotions" element={<ChannelPromotions />} />
                                                    <Route path="channel-manager/logs" element={<SyncLogs />} />
                                                    {/* RMS Routes */}
                                                    <Route path="rms" element={<Navigate to="/admin/revenue" replace />} />
                                                    {/* Revenue Management Routes */}
                                                    <Route path="revenue/calendar" element={<RateCalendar />} />
                                                    <Route path="revenue/pickup" element={<PickupAnalysis />} />
                                                    <Route path="revenue/forecast" element={<DemandForecast />} />
                                                    <Route path="revenue/competitors" element={<CompetitorRates />} />
                                                    <Route path="revenue/segments" element={<Segmentation />} />
                                                    <Route path="revenue/pricing" element={<PricingRules />} />
                                                    <Route path="revenue/payment-analytics" element={<PaymentAnalytics />} />
                                                    <Route path="revenue/ai" element={<RevenueAI />} />
                                                    {/* AI Routes */}
                                                    <Route path="ai/reputation" element={<ReputationAI />} />
                                                    <Route path="ai/crm" element={<CRM />} />
                                                    <Route path="ai/crm-dashboard" element={<CRMAIDashboard />} />
                                                    <Route path="ai/crm-chat" element={<CRMAI />} />
                                                    {/* Maintenance Specializations */}
                                                    <Route path="maintenance/specializations" element={<TechnicianSpecializations />} />
                                                    {/* Night Audit */}
                                                    <Route path="night-audit" element={<NightAudit />} />
                                                    <Route path="corporate-accounts" element={<CorporateAccounts />} />
                                                    <Route path="ar-ledger" element={<ARLedger />} />
                                                    <Route path="audit-logs" element={<AuditLogs />} />
                                                    <Route path="cashier-sessions" element={<CashierSessions />} />
                                                    <Route path="room-moves" element={<RoomMoves />} />
                                                    <Route path="pos-closure" element={<PosClosurePage />} />
                                                    <Route path="paymaster" element={<PaymasterAccounts />} />
                                                    <Route path="audit-pack" element={<AuditPackPage />} />
                                                    <Route path="multi-room" element={<MultiRoomBooking />} />
                                                    <Route path="transaction-codes" element={<TransactionCodes />} />
                                                    <Route path="preauth-holds" element={<PreAuthHolds />} />
                                                    <Route path="rate-check" element={<RateCheckReport />} />
                                                  </Route>
                                                </Routes>
                                              </Suspense>
                                            </RMSProvider>
                                          </AIInsightsProvider>
                                        </ChannelManagerProvider>
                                      </AdminProvider>
                                  </SSEProvider>
                                </ToastProvider>
                              </ProtectedRoute>
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
                          <Route path="/set-password" element={<SetFirstPassword />} />
                          {/* 404 */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </SettingsProvider>
                      </CBSProvider>
                    </GuestAIProvider>
                  </BookingProvider>
                </PreCheckInProvider>
              </AGIChatProvider>
            </ChatProvider>
          </AuthProvider>
            </Router>
          </BrandingProvider>
        </WishlistProvider>
      </ThemeProvider>
    </HotelGuard>
  );
}

export default App;
