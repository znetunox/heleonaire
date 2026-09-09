import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { CharacterInfo } from '../store/appStore';
import API from '../api/client';
import './screens.css';

const CLASS_INFO: Record<string, { icon: string; desc: string; color: string }> = {
  knight:   { icon: '⚔️', desc: 'Tank, frontline, espada e escudo', color: '#c0a060' },
  assassin: { icon: '🗡️', desc: 'DPS burst, invisibilidade, execuções', color: '#a060c0' },
  archer:   { icon: '🏹', desc: 'DPS ranged, armadilhas, mobilidade', color: '#60c060' },
  mage:     { icon: '🔮', desc: 'DPS mágico AoE, controle', color: '#6080c0' },
  cleric:   { icon: '✨', desc: 'Healer, buffs, ressurreição', color: '#c0c060' },
};

const FACTION_INFO: Record<string, { name: string; desc: string; color: string }> = {
  heleonaire: { name: 'Ordem dos Heleonaire', desc: 'Guardiões do poder ancestral', color: '#4080c0' },
  darkpact:   { name: 'Pacto Sombrio', desc: 'Consumidores das trevas', color: '#c04040' },
};

export default function CharacterSelectScreen() {
  const { token, setCharacters, characters, setActiveCharacter, setScreen, logout } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CharacterInfo | null>(null);

  useEffect(() => {
    if (!token) { setScreen('login'); return; }
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/characters');
      setCharacters(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar personagem? Esta ação é irreversível.')) return;
    await API.delete(`/api/characters/${id}`);
    loadCharacters();
    if (selected?.id === id) setSelected(null);
  };

  const handleEnterWorld = () => {
    if (!selected) return;
    setActiveCharacter(selected);
    setScreen('loading');
  };

  return (
    <div className="screen-overlay">
      <div className="screen-bg" />
      <div className="char-select-container">
        <div className="game-logo">
          <h1>HELEONAIRE</h1>
          <p className="logo-subtitle">Selecione seu Personagem</p>
        </div>

        {loading ? (
          <div className="loading-text">Carregando personagens...</div>
        ) : (
          <div className="char-slots">
            {/* Slots de personagem (máx 3) */}
            {[0, 1, 2].map(i => {
              const char = characters[i];
              const isSelected = selected?.id === char?.id;

              return (
                <div
                  key={i}
                  className={`char-slot ${char ? 'occupied' : 'empty'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => char && setSelected(char)}
                >
                  {char ? (
                    <>
                      <div className="char-class-icon">{CLASS_INFO[char.class]?.icon ?? '?'}</div>
                      <div className="char-name">{char.name}</div>
                      <div className="char-class" style={{ color: CLASS_INFO[char.class]?.color }}>
                        {char.class.charAt(0).toUpperCase() + char.class.slice(1)} — Lv. {char.level}
                      </div>
                      <div className="char-faction" style={{ color: FACTION_INFO[char.faction]?.color }}>
                        {FACTION_INFO[char.faction]?.name}
                      </div>
                      <button
                        className="btn-delete"
                        onClick={e => { e.stopPropagation(); handleDelete(char.id); }}
                      >
                        Deletar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-create-char"
                      onClick={() => setScreen('char_create')}
                      disabled={characters.length >= 3}
                    >
                      <span>+</span>
                      <small>Criar Personagem</small>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="char-select-actions">
          <button
            className="btn-primary btn-large"
            onClick={handleEnterWorld}
            disabled={!selected}
          >
            Entrar no Mundo
          </button>
          <button className="btn-secondary" onClick={logout}>
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
