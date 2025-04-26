import { useState } from "react";
import "./Auth.css";
import { supabase } from "../../client";
import { useNavigate } from "react-router-dom";


function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const handleAuth = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    const { error } = result;
    if (error) {
      setError(error.message);
    } else {
      console.log(isSignUp ? "Signed up!" : "Logged in!");
      navigate("/home");
    }

    setLoading(false);
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <div className="auth-page">
        <form onSubmit={handleAuth}>
          <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
          <label htmlFor="email">Email:</label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <p>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </p>
        </form>
      </div>
    </>
  );
}

export default Auth;
