import { Link, useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../app/auth";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  return (
    <AuthForm
      title="Create account"
      submitLabel="Register"
      onSubmit={async (email, password) => {
        await register(email, password);
        navigate("/library");
      }}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    />
  );
};
