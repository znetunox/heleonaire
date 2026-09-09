import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import API from '../api/client';
import './screens.css';

const CLASSES = [
  { id: 'knight',   name: 'Cavaleiro',  icon: '⚔️',  desc: 'Tank resistente. Espada e escudo. Defende aliados.', stats: 'STR ████ AGI ██ VIT ████' },
  { id: 'assassin', name: 'Assassino',  icon: '🗡️',  desc: 'Burst de dano. Invisibilidade e execuções letais.',  stats: 'STR ███ AGI ████ LUK ████' },
  { id: 'archer',   name: 'Arqueiro',   icon: '🏹',  desc: 'Dano à distância. Armadilhas e alta mobilidade.',    stats: 'DEX ████ AGI ███ STR ██' },
  { id: 'mage',     name: 'Mago',       icon: '🔮',  desc: 'AoE mágico devastador. Controle de multidão.',      stats: 'INT ████ DEX ███ SPI ███' },
  { id: 'cleric',   name: 'Clérigo',   icon: '✨',  desc: 'Healer do grupo. Buffs, curas e ressurreição.',      stats: 'INT ███ SPI ████ VIT ███' },
];

const FACTIONS = [
  { id: 'heleonaire', name: 'Ordem dos Heleonaire', icon: '🛡️', color: '#4080c0', desc: 'Guardiões do legado ancestral. Luz e ordem.' },
  { id: 'darkpact',   name: 'Pacto Sombrio',        icon: '💀', color: '#c04040', desc: 'Consumidores das trevas. Poder a qualquer custo.' },
];

export default function CharacterCreateScreen() {
  const { setScreen, setCharacters } = useAppStore();
  const [selectedClass, setSelectedClass] = useState('knight');
  const [selectedFaction, setSelectedFaction] = useState('heleonaire');
  const [charName, setCharName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!charName.trim()) { setError('Digite o nome do personagem'); return; }
    setLoading(true);
    try {
      await API.post('/api/characters', {
        name: charName.trim(),
        charClass: selectedClass,
        faction: selectedFaction,
      });
      const res = await API.get('/api/characters');
      setCharacters(res.data);
      setScreen('char_select');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar personagem');
    } finally {
      setLoading(false);
    }
  };

  const activeClass = CLASSES.find(c => c.id === selectedClass)!;

  return (
    <div className="screen-overlay">
      <div className="screen-bg" />
      <div className="char-create-container">
        <div className="game-logo">
          <h1>HELEONAIRE</h1>
          <p className="logo-subtitle">Criar Personagem</p>
        </div>

        <form onSubmit={handleCreate}>
          {/* Class Selection */}
          <section className="create-section">
            <h3>Escolha sua Classe</h3>
            <div className="class-grid">
              {CLASSES.map(cls => (
                <button
                  key={cls.id}
                  type="button"
                  className={`class-card ${selectedClass === cls.id ? 'selected' : ''}`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <span className="class-icon">{cls.icon}</span>
                  <span className="class-name">{cls.name}</span>
                </button>
              ))}
            </div>
            <div className="class-preview">
              <strong>{activeClass.name}</strong>
              <p>{activeClass.desc}</p>
              <small className="stats-bar">{activeClass.stats}</small>
            </div>
          </section>

          {/* Faction Selection */}
          <section className="create-section">
            <h3>Escolha sua Facção</h3>
            <div className="faction-grid">
              {FACTIONS.map(fac => (
                <button
                  key={fac.id}
                  type="button"
                  className={`faction-card ${selectedFaction === fac.id ? 'selected' : ''}`}
                  style={{ '--faction-color': fac.color } as React.CSSProperties}
                  onClick={() => setSelectedFaction(fac.id)}
                >
                  <span className="faction-icon">{fac.icon}</span>
                  <span className="faction-name">{fac.name}</span>
                  <small>{fac.desc}</small>
                </button>
              ))}
            </div>
          </section>

          {/* Name */}
          <section className="create-section">
            <h3>Nome do Personagem</h3>
            <input
              className="char-name-input"
              type="text"
              value={charName}
              onChange={e => setCharName(e.target.value)}
              placeholder="Digite um nome único..."
              maxLength={24}
              minLength={3}
              required
            />
          </section>

          {error && <p className="form-error">{error}</p>}

          <div className="create-actions">
            <button type="submit" className="btn-primary btn-large" disabled={loading}>
              {loading ? 'Criando...' : `Criar ${activeClass.name}`}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setScreen('char_select')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
