import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import API from '../api/client';
import './screens.css';

export default function RegisterScreen() {
  const { setAuth, setScreen } = useAppStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/api/auth/register', { username, email, password });
      setAuth(res.data.token, res.data.accountId, res.data.username);
      setScreen('char_select');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-overlay">
      <div className="screen-bg" />
      <div className="screen-card">
        <div className="game-logo">
          <h1>HELEONAIRE</h1>
          <p className="logo-subtitle">Criar Nova Conta</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Escolha seu usuário"
              required
              minLength={3}
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <button type="button" className="btn-secondary" onClick={() => setScreen('login')}>
            Já tenho conta
          </button>
        </form>
      </div>
    </div>
  );
}
