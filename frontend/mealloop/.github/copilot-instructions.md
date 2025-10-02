# Copilot Instructions for Mealloop Frontend (React + Vite)

## Project Architecture
- **Frontend is built with React (JSX) and Vite.**
- Main app entry: `src/main.jsx` wraps the app in `AuthProvider` for global authentication state.
- Routing is handled via `react-router-dom` in `src/App.jsx`.
- Pages are in `src/pages/` (e.g., `HomePage.jsx`, `LoginPage.jsx`, `DonorDashboard.jsx`).
- Shared UI components are in `src/components/` (e.g., `Navbar.jsx`, `Footer.jsx`).
- Context for authentication is in `src/context/AuthContext.jsx`.
- Custom hooks (e.g., geolocation, socket) are in `src/hooks/`.
- API calls are abstracted in `src/services/api.js`.

## Developer Workflows
- **Start dev server:**
  ```sh
  npm run dev
  ```
- **Build for production:**
  ```sh
  npm run build
  ```
- **Lint:**
  ```sh
  npm run lint
  ```
- No test scripts or test files are present by default.

## Patterns & Conventions
- **Auth State:** Use `useAuth()` from context for user info, login/logout, and role-based rendering.
- **Routing:** All pages are connected via `<Routes>` in `App.jsx`. Add new pages to `src/pages/` and update routes in `App.jsx`.
- **Protected Routes:** Use `Navigate` from `react-router-dom` to redirect unauthenticated users in dashboard pages.
- **Role-based UI:** Render dashboard links and content based on `user.role` from auth context.
- **API Usage:** Use functions from `src/services/api.js` for backend communication. Handle errors and loading states in components.
- **Assets:** Images and static files are in `src/assets/` and `public/`.
- **Styling:** Uses CSS files (`App.css`, `index.css`). Tailwind or custom classes may be present in components.

## Integration Points
- **External dependencies:**
  - `react-router-dom` for routing
  - `@vitejs/plugin-react` for Vite integration
  - Custom hooks for geolocation and sockets
- **AuthContext:** Central for user/session management. Wraps the app in `main.jsx`.
- **API:** All backend calls go through `src/services/api.js`.

## Examples
- To add a new page:
  1. Create `src/pages/NewPage.jsx`
  2. Add `<Route path="/new" element={<NewPage />} />` in `App.jsx`
- To protect a route:
  ```jsx
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  ```
- To show user info in Navbar:
  ```jsx
  const { user } = useAuth();
  <span>{user?.name}</span>
  ```

## Troubleshooting
- If nothing displays, check for errors in the browser console and terminal output.
- Ensure `AuthProvider` wraps the app in `main.jsx`.
- Confirm all imports use correct relative paths.

---
_Keep instructions concise and focused on Mealloop's actual codebase and workflows. Update this file as new patterns emerge._
