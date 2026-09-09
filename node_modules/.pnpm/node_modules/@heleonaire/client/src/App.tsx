import { useEffect, useRef } from 'react';
import { createGame } from './game/Game';
import { useAppStore } from './store/appStore';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CharacterSelectScreen from './screens/CharacterSelectScreen';
import CharacterCreateScreen from './screens/CharacterCreateScreen';
import LoadingScreen from './screens/LoadingScreen';
import ROHUD from './ui/ROHUD';
import './App.css';

function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const { screen } = useAppStore();

  useEffect(() => {
    // Only init game when we are on the 'game' screen
    if (screen !== 'game' || !gameRef.current || initialized.current) return;
    initialized.current = true;

    const game = createGame(gameRef.current);

    return () => {
      game.destroy(true);
      initialized.current = false;
    };
  }, [screen]);

  return (
    <div className="app-container">
      {screen === 'login' && <LoginScreen />}
      {screen === 'register' && <RegisterScreen />}
      {screen === 'char_select' && <CharacterSelectScreen />}
      {screen === 'char_create' && <CharacterCreateScreen />}
      {screen === 'loading' && <LoadingScreen />}

      {/* Game layer (only visible in game state) */}
      {screen === 'game' && <ROHUD />}
      <div 
        id="game-container" 
        ref={gameRef} 
        style={{ display: screen === 'game' ? 'block' : 'none' }}
      />
    </div>
  );
}

export default App;
