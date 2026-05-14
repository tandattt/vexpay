import { useMemo } from "react";
import { LoginPage } from "../features/auth";
import { CheckoutPage } from "../features/checkout";
import { useAuth } from "../shared/hooks";
import DashboardPage from "../pages/DashboardPage";

function parsePayId(pathname: string): string | null {
  const match = pathname.match(/^\/pay\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

export default function App() {
  const { token, user, signIn, signOut } = useAuth();
  const paymentId = useMemo(() => parsePayId(window.location.pathname), []);

  if (paymentId) {
    return (
      <CheckoutPage
        paymentId={paymentId}
        token={token}
        userName={user?.fullName ?? null}
        onLogin={(response) => signIn(response.accessToken, response.user)}
      />
    );
  }

  if (!token || !user) {
    return (
      <LoginPage
        onSuccess={(response) => signIn(response.accessToken, response.user)}
      />
    );
  }

  return <DashboardPage user={user} token={token} onSignOut={signOut} />;
}
