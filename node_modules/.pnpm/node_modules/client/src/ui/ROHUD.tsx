import React, { useState, useEffect, useRef } from 'react';
import { useHUDStore } from '../store/hudStore';
import './ro-hud.css';

export default function ROHUD() {
    const {
        playerInfo,
        targetInfo,
        logs,
        inventoryItems,
        showInventory,
        showStatus,
        showSkills,
        room,
        addLog,
        setTargetInfo,
        toggleInventory,
        toggleStatus,
        toggleSkills,
    } = useHUDStore();

    const [chatInput, setChatInput] = useState('');

    type StatKey = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk';

    const handleDistributeStat = (stat: StatKey) => {
        if (!room) {
            console.warn('[ROHUD] Colyseus room not connected.');
            return;
        }

        room.send('distributeStat', {
            stat,
            amount: 1,
        });
    };

    const handleUseItem = (inventoryId: string) => {
        if (!room) {
            console.warn('[ROHUD] Colyseus room not connected.');
            return;
        }

        if (!inventoryId) {
            console.warn('[ROHUD] Invalid inventoryId.');
            return;
        }

        room.send('useItem', {
            inventoryId,
        });
    };

    const handleEquipItem = (inventoryId: string) => {
        if (!room) {
            console.warn('[ROHUD] Colyseus room not connected.');
            return;
        }

        if (!inventoryId) {
            console.warn('[ROHUD] Invalid inventoryId.');
            return;
        }

        console.log(
            `[ROHUD] Equipping inventory item: ${inventoryId}`,
        );

        room.send('equipItem', {
            inventoryId,
        });
    };

  const logEndRef = useRef<HTMLDivElement>(null);

  // Keyboard Hotkeys (I = Inventory, A = Status, S = Skills)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in chat
      if (document.activeElement?.tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      if (key === 'i') toggleInventory();
      if (key === 'a' || key === 'c') toggleStatus();
      if (key === 's' || key === 'k') toggleSkills();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInventory, toggleStatus, toggleSkills]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !playerInfo) return;
    addLog(`${playerInfo.name}: ${chatInput}`, '#00e5ff');
    setChatInput('');
  };

  const hpPercent = playerInfo ? Math.max(0, Math.min(100, (playerInfo.hp / playerInfo.maxHp) * 100)) : 100;
  const mpPercent = playerInfo ? Math.max(0, Math.min(100, (playerInfo.mp / playerInfo.maxMp) * 100)) : 100;
  const expPercent = playerInfo ? Math.max(0, Math.min(100, (playerInfo.baseExp / playerInfo.maxBaseExp) * 100)) : 0;

  const targetHpPercent = targetInfo ? Math.max(0, Math.min(100, (targetInfo.hp / targetInfo.maxHp) * 100)) : 100;

  return (
    <div className="ro-hud-container">
      {/* ── 1. Basic Info Window ── */}
      {playerInfo && (
        <div className="ro-window ro-basic-info">
          <div className="ro-window-titlebar">
            <span>Basic Info</span>
            <div className="ro-menu-buttons">
              <button title="Status (A)" onClick={toggleStatus}>STAT</button>
              <button title="Inventory (I)" onClick={toggleInventory}>ITEMS</button>
              <button title="Skills (S)" onClick={toggleSkills}>SKILL</button>
            </div>
          </div>
          <div className="ro-window-body">
            <div className="ro-char-name-row">
              <span className="ro-char-name">{playerInfo.name}</span>
              <span className="ro-char-level">Base Lv. {playerInfo.level}</span>
            </div>
            <div className="ro-class-tag">{playerInfo.class.toUpperCase()}</div>

            {/* HP Bar */}
            <div className="ro-bar-container">
              <span className="ro-bar-label">HP</span>
              <div className="ro-bar ro-hp-bar">
                <div className="ro-bar-fill" style={{ width: `${hpPercent}%` }} />
                <span className="ro-bar-text">{playerInfo.hp} / {playerInfo.maxHp}</span>
              </div>
            </div>

            {/* SP Bar */}
            <div className="ro-bar-container">
              <span className="ro-bar-label">SP</span>
              <div className="ro-bar ro-sp-bar">
                <div className="ro-bar-fill" style={{ width: `${mpPercent}%` }} />
                <span className="ro-bar-text">{playerInfo.mp} / {playerInfo.maxMp}</span>
              </div>
            </div>

            {/* Base Exp Bar */}
            <div className="ro-bar-container">
              <span className="ro-bar-label">EXP</span>
              <div className="ro-bar ro-exp-bar">
                <div className="ro-bar-fill" style={{ width: `${expPercent}%` }} />
                <span className="ro-bar-text">{expPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Target Lock Frame ── */}
      {targetInfo && (
        <div className="ro-window ro-target-frame">
          <div className="ro-window-titlebar">
            <span>Target — {targetInfo.name}</span>
            <button className="ro-close-btn" onClick={() => setTargetInfo(null)}>✕</button>
          </div>
          <div className="ro-window-body">
            <div className="ro-target-details">
              <span>Lv. {targetInfo.level}</span>
              <span>HP: {targetInfo.hp} / {targetInfo.maxHp}</span>
            </div>
            <div className="ro-bar ro-target-hp-bar">
              <div className="ro-bar-fill" style={{ width: `${targetHpPercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Status / Attributes Window (Alt+A) ── */}
      {showStatus && (
        <div className="ro-window ro-status-window">
          <div className="ro-window-titlebar">
            <span>Character Status (A)</span>
            <button className="ro-close-btn" onClick={toggleStatus}>✕</button>
          </div>
          <div className="ro-window-body">
            <div className="ro-stats-grid">
                          <div className="ro-stat-row">
                              <span>STR:</span>
                              <strong>{playerInfo?.str ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('str')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
                          <div className="ro-stat-row">
                              <span>AGI:</span>
                              <strong>{playerInfo?.agi ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('agi')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
                          <div className="ro-stat-row">
                              <span>VIT:</span>
                              <strong>{playerInfo?.vit ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('vit')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
                          <div className="ro-stat-row">
                              <span>INT:</span>
                              <strong>{playerInfo?.int ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('int')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
                          <div className="ro-stat-row">
                              <span>DEX:</span>
                              <strong>{playerInfo?.dex ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('dex')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
                          <div className="ro-stat-row">
                              <span>LUK:</span>
                              <strong>{playerInfo?.luk ?? 1}</strong>
                              <button
                                  className="ro-plus-btn"
                                  onClick={() => handleDistributeStat('luk')}
                                  disabled={!room || (playerInfo?.statPoints ?? 0) <= 0}
                              >
                                  +
                              </button>
                          </div>
            </div>

            <div className="ro-divider" />

                      <div className="ro-derived-stats">
                          <div>
                              <span>ATK:</span>
                              <span>{playerInfo?.atk ?? 0}</span>
                          </div>

                          <div>
                              <span>MATK:</span>
                              <span>{playerInfo?.matk ?? 0}</span>
                          </div>

                          <div>
                              <span>DEF:</span>
                              <span>{playerInfo?.def ?? 0}</span>
                          </div>

                          <div>
                              <span>MDEF:</span>
                              <span>{playerInfo?.magicDefense ?? 0}</span>
                          </div>

                          <div>
                              <span>HIT:</span>
                              <span>{playerInfo?.hit ?? 0}</span>
                          </div>

                          <div>
                              <span>FLEE:</span>
                              <span>{playerInfo?.flee ?? 0}</span>
                          </div>

                          <div>
                              <span>CRIT:</span>
                              <span>{playerInfo?.crit ?? 0}%</span>
                          </div>

                          <div>
                              <span>ASPD:</span>
                              <span>{playerInfo?.aspd ?? 0}</span>
                          </div>
                      </div>

            <div className="ro-stat-points">
                          <span>
                              Status Points Available:
                              <strong>{playerInfo?.statPoints ?? 0}</strong>
                          </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Inventory Window (Alt+E / I) ── */}
      {showInventory && (
        <div className="ro-window ro-inventory-window">
          <div className="ro-window-titlebar">
            <span>Inventory (I)</span>
            <button className="ro-close-btn" onClick={toggleInventory}>✕</button>
          </div>
          <div className="ro-window-body">
            <div className="ro-inventory-grid">
                          {inventoryItems.map((item) => (
                              <div
                                  key={item.id}
                                  className="ro-item-slot"
                                  title={`${item.itemName} (ID: ${item.itemId})`}
                                  onClick={() => handleUseItem(item.id)}
                                  onContextMenu={(e) => {
                                      e.preventDefault();
                                      handleEquipItem(item.id);
                                  }}
                              >
                                  <span className="ro-item-icon">?</span>
                                  <span className="ro-item-count">{item.quantity}</span>
                              </div>
                          ))}
              {Array.from({ length: Math.max(0, 16 - inventoryItems.length) }).map((_, idx) => (
                <div key={idx} className="ro-item-slot empty" />
              ))}
            </div>
            <div className="ro-inventory-footer">
              <span>Weight: 120 / 2000</span>
              <span>Zeny: 1,500 z</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Skill Window (Alt+S) ── */}
      {showSkills && (
        <div className="ro-window ro-skill-window">
          <div className="ro-window-titlebar">
            <span>Skill Tree (S)</span>
            <button className="ro-close-btn" onClick={toggleSkills}>✕</button>
          </div>
          <div className="ro-window-body">
            <div className="ro-skill-list">
              <div className="ro-skill-item">
                <span className="ro-skill-icon">⚔️</span>
                <div className="ro-skill-info">
                  <strong>Bash (Lv. 5)</strong>
                  <small>Single target heavy physical blow (150% ATK)</small>
                </div>
                <button className="ro-use-btn">Use</button>
              </div>

              <div className="ro-skill-item">
                <span className="ro-skill-icon">🛡️</span>
                <div className="ro-skill-info">
                  <strong>Magnum Break (Lv. 3)</strong>
                  <small>AoE Fire explosion around character</small>
                </div>
                <button className="ro-use-btn">Use</button>
              </div>

              <div className="ro-skill-item">
                <span className="ro-skill-icon">💖</span>
                <div className="ro-skill-info">
                  <strong>Increase HP Recovery (Lv. 10)</strong>
                  <small>Passive: Regenerates 50 HP every 10s</small>
                </div>
                <span className="ro-passive-tag">PASSIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Map Name & Radar ── */}
      <div className="ro-window ro-minimap-info">
        <span className="ro-map-title">Plains of Ash</span>
        <small className="ro-map-coords">ash_field01</small>
      </div>

      {/* ── 7. Hotbar ── */}
      <div className="ro-window ro-hotbar">
        {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9'].map((key, i) => (
          <div key={key} className="ro-hotbar-slot">
            <span className="ro-hotbar-key">{key}</span>
            <div className="ro-hotbar-icon">
              {i === 0 ? '⚔️' : i === 1 ? '🧪' : i === 2 ? '💧' : i === 3 ? '🛡️' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* ── 8. Chat Box ── */}
      <div className="ro-window ro-chat-box">
        <div className="ro-chat-logs">
          {logs.map((log) => (
            <div key={log.id} className="ro-log-line" style={{ color: log.color || '#ffffff' }}>
              <span className="ro-log-time">[{log.timestamp}]</span> {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <form onSubmit={handleSendChat} className="ro-chat-form">
          <input
            type="text"
            className="ro-chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Digite sua mensagem ou comando..."
          />
          <button type="submit" className="ro-chat-btn">Enviar</button>
        </form>
      </div>
    </div>
  );
}
