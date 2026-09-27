import { useState } from "react";
import { useRouter } from "next/router";
import { login } from "../lib/auth";
import Logo from "../components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    }
  }

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <div className="brandRow">
          <Logo size={36} />
          <div className="brand" style={{ fontSize: 28 }}>TERANGA<span>FIT</span></div>
        </div>
        <p className="sub">Connexion à l'espace de gestion</p>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">Se connecter</button>
      </form>
    </div>
  );
}
