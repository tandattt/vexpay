import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { token, user, signIn, signOut } = useAuth();

  if (!token || !user) {
    return (
      <LoginPage
        onSuccess={(response) => signIn(response.accessToken, response.user)}
      />
    );
  }

  return <DashboardPage user={user} token={token} onSignOut={signOut} />;
}
