import AppRouter from "./AppRouter";
import { AuthSessionProvider } from "./features/auth/context/AuthSessionContext";
import { StoreProvider } from "./features/stores";
import { LoadingProvider } from "./shared/loading";
import { ToastProvider } from "./shared/toast/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <LoadingProvider>
        <AuthSessionProvider>
          <StoreProvider>
            <AppRouter />
          </StoreProvider>
        </AuthSessionProvider>
      </LoadingProvider>
    </ToastProvider>
  );
}
