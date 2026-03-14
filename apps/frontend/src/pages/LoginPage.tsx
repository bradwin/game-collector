import { Link, useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../app/auth";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthForm
      title="Sign in"
      submitLabel="Login"
      onSubmit={async (email, password) => {
        await login(email, password);
        navigate("/library");
      }}
      footer={
        <>
          New here? <Link to="/register">Create account</Link>
        </>
      }
    />
  );
};
