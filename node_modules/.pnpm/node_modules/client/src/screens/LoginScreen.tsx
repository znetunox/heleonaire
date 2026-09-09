import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import API from '../api/client';
import './screens.css';

export default function LoginScreen() {
  const { setAuth, setScreen } = useAppStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/api/auth/login', { username, password });
      setAuth(res.data.token, res.data.accountId, res.data.username);
      setScreen('char_select');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-overlay">
      <div className="screen-bg" />
      <div className="particles" />
      <div className="screen-card">
        <div className="game-logo">
          <h1>HELEONAIRE</h1>
          <p className="logo-subtitle">The Dark Age of Aethermor</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Seu usuário"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Mundo'}
          </button>

          <button type="button" className="btn-secondary" onClick={() => setScreen('register')}>
            Criar Conta
          </button>
        </form>

        <p className="screen-footer">
          &copy; 2026 Heleonaire. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
