import { useAuth } from '../hooks/useAuth.js';

export function LoginButton(): React.JSX.Element {
  const { login } = useAuth();

  return (
    <button type="button" onClick={login} className="login-button">
      Sign in with Google
    </button>
  );
}
