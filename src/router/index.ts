// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useSimpleAuth } from "../composables/useSimpleAuth";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
    hideNavigation?: boolean;
  }
}

/* =========================
   Lazy-loaded Pages
   ========================= */

// Auth & Public
const UnauthorizedAccess = () => import("../pages/Auth/UnauthorizedAccess.vue");
const JWTLogin = () => import("../pages/Auth/JWTLogin.vue");
// const Register = () => import('../pages/Auth/Register.vue') 

// Core
const Profile = () => import("../pages/Profile/Profile.vue");

// Development/Testing
const WebSocketTest = () => import("../components/WebSocketTest.vue");

// Control
const Control = () => import("../pages/Control/Control.vue");
const SurveyControl = () => import("../pages/Control/SurveyControl.vue");
const UserManagement = () =>
  import("../pages/Control/UserManagement/UserManagement.vue");

// Surveys
const Surveys = () => import("../pages/Survey/Surveys.vue");
const SurveyResponses = () => import("../pages/Survey/SurveyResponses.vue");
const SurveyAnalytics = () => import("../pages/Survey/SurveyAnalytics.vue");
const PublicSurveyView = () => import("../pages/Survey/PublicSurveyView.vue");
const PasswordProtectedSurveyView = () =>
  import("../pages/Survey/PasswordProtectedSurveyView.vue");
const AuthSurveyView = () => import("../pages/Survey/AuthSurveyView.vue");
const SurveyEditorPage = () => import("../pages/Control/SurveyEditorPage.vue");

// Notifications
const Notifications = () => import("../pages/Notifications");

/* =========================
   Routes
   ========================= */
const routes: RouteRecordRaw[] = [
  { 
    path: "/", 
    name: "UnauthorizedAccess",
    component: UnauthorizedAccess,
    meta: { title: "Unauthorized Access - WPC | WeaponpowerCloud App" }
  },

  {
    path: "/login",
    name: "Login",
    component: JWTLogin,
    meta: { title: "Login - WPC | WeaponpowerCloud App", requiresGuest: true },
  },
  /*
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: 'Register - WPC | WeaponpowerCloud App', requiresGuest: true }
  },
  */

  // ✅ Public survey routes 
  {
    path: "/survey/public/:token",
    name: "PublicSurvey",
    component: PublicSurveyView,
    meta: { title: "Public Survey - WPC | WeaponpowerCloud App" },
  },
  {
    path: "/survey/password/:token",
    name: "PasswordProtectedSurvey",
    component: PasswordProtectedSurveyView,
    meta: { title: "Protected Survey - WPC | WeaponpowerCloud App" },
  },

  // Authenticated app
  {
    path: "/surveys",
    name: "Surveys",
    component: Surveys,
    meta: { title: "Surveys - WPC | WeaponpowerCloud App", requiresAuth: true },
  },
  {
    path: "/surveys/take/:id",
    name: "AuthSurveyTake",
    component: AuthSurveyView,
    meta: {
      title: "Take Survey - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      hideNavigation: true,
    },
  },

  // Notifications
  {
    path: "/notifications",
    name: "Notifications",
    component: Notifications,
    meta: { title: "Notifications - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // WebSocket Test (Development only)
  {
    path: "/websocket-test",
    name: "WebSocketTest",
    component: WebSocketTest,
    meta: { title: "WebSocket Test - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // Control (Admins only)
  {
    path: "/control",
    name: "Control",
    component: Control,
    meta: {
      title: "Control Panel - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys",
    name: "SurveyControl",
    component: SurveyControl,
    meta: {
      title: "Survey Management - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/create",
    name: "SurveyCreate",
    component: SurveyEditorPage,
    meta: {
      title: "Create Survey - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/edit/:id",
    name: "SurveyEdit",
    component: SurveyEditorPage,
    meta: {
      title: "Edit Survey - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/users",
    name: "UserManagement",
    component: UserManagement,
    meta: {
      title: "User Management - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/:surveyId/responses",
    name: "SurveyResponses",
    component: SurveyResponses,
    meta: {
      title: "Survey Responses - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/surveys/:surveyId/analytics",
    name: "SurveyAnalytics",
    component: SurveyAnalytics,
    meta: {
      title: "Survey Analytics - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/control/responses",
    name: "AllSurveyResponses",
    component: SurveyResponses,
    meta: {
      title: "All Survey Responses - WPC | WeaponpowerCloud App",
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { title: "Profile - WPC | WeaponpowerCloud App", requiresAuth: true },
  },

  // ✅ 404 fallback
  { path: "/:pathMatch(.*)*", redirect: "/surveys" },
];

/* =========================
   Router
   ========================= */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // ✅ BASE_URL مهم للديبلوي تحت ساب-باث
  routes,
});

/* =========================
   Global Guards
   ========================= */

router.beforeEach(async (to, _from, next) => {
  
  // ✅ CRITICAL: Public survey routes MUST bypass all authentication checks
  // This ensures survey links like /survey/public/:token are always accessible
  if (to.path.startsWith("/survey/")) {
    return next();
  }

  const { isAuthenticated, checkAuth, user } = useSimpleAuth();

  const requiresAuth = to.matched.some((r) => r.meta?.requiresAuth);
  const requiresGuest = to.matched.some((r) => r.meta?.requiresGuest);
  const requiresAdmin = to.matched.some((r) => r.meta?.requiresAdmin);

  let authenticated = isAuthenticated.value;

  // ✅ If authenticated user tries to access UnauthorizedAccess page, redirect to /surveys
  if (to.path === "/" && authenticated) {
    return next("/surveys");
  }

  // ✅ Prevent infinite redirect loops on root path
  if (to.path === "/" && _from.path === "/") {
    return next();
  }
  // ✅ Check authentication for protected routes
  if (requiresAuth && !authenticated) {
    try {
      authenticated = await checkAuth();
    } catch {
      authenticated = false;
    }

    if (!authenticated) {
      // Redirect unauthenticated users to UnauthorizedAccess page
      return next("/");
    }
  }

  // ✅ Redirect authenticated users away from guest-only pages (login, register)
  if (requiresGuest && authenticated) {
    const redirectTo = (to.query.redirect as string) || "/surveys";
    return next(redirectTo);
  }

  // ✅ Check admin role for admin-only routes
  if (requiresAdmin) {
    // Re-check authentication if needed
    if (!authenticated) {
      try {
        authenticated = await checkAuth();
      } catch {
        authenticated = false;
      }
    }

    if (!authenticated) {
      // Unauthenticated users trying to access admin routes → UnauthorizedAccess
      return next("/");
    }

    const currentUser = user.value;
    const ADMIN_ROLES = new Set(["admin", "super_admin"]);
    
    // If user is authenticated but not an admin, redirect to surveys
    if (!currentUser || !ADMIN_ROLES.has(currentUser.role)) {
      return next("/surveys");
    }
  }

  return next();
});

/* =========================
   Title Handling
   ========================= */
router.afterEach(() => {
  document.title = "WHSO Survey";
});

export default router;
