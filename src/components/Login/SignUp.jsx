import "./Auth.css";
import { useState } from 'react';
import { supabase } from "../../client";
import { useNavigate } from "react-router-dom";


function SignUp()
{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");

    const navigate = useNavigate();

    async function handleSignUp(e) 
    {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        display_name: displayName
                    }
                }
            });

        if (error) {
            throw error;
        }

        if (data.session) {
            navigate("/home");
        } else {
            alert("Check your email to confirm your account!");
        }

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="auth-page">
                <form onSubmit={handleSignUp}>
                    <label>
                        Username:
                        <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        maxLength={30}
                        pattern="[A-Za-z0-9_]+"
                        title="Username must contain only letters, numbers, and underscores."
                        />
                        3-30 characters, letters, numbers, and underscores.
                        Permanent after registration.
                    </label>
                    <label>
                        Display Name:
                        <input 
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            maxLength={50}
                        />
                        Can be changed later.
                    </label>

                    <label htmlFor="email"> Email:
                        <input 
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label htmlFor="password">Password: 
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                    {error && <p style={{color: "red"}}>{error}</p>}

                    <p>
                        Already have an account?
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                        >
                        Login
                        </button>
                    </p>
                </form>
            </div>
        </>
    )
}

export default SignUp;