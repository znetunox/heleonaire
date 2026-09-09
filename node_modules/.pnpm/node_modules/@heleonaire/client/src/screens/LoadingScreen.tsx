import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import './screens.css';

const LORE_QUOTES = [
  '"O último dos Heleonaire caiu. As terras mergulharam no caos."',
  '"Quem controla os castelos controla os fragmentos de poder."',
  '"Dois lados. Uma guerra. Apenas um sobreviverá."',
  '"Aethermor espera. O destino do mundo está em suas mãos."',
];

export default function LoadingScreen() {
  const { setScreen } = useAppStore();
  const [progress, setProgress] = useState(0);
  const [quote] = useState(() => LORE_QUOTES[Math.floor(Math.random() * LORE_QUOTES.length)]);

  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];

    // Simular loading progress (substituir por real asset loading depois)
    const steps = [10, 30, 50, 70, 90, 100];
    steps.forEach((p, i) => {
      intervals.push(setTimeout(() => {
        setProgress(p);
        if (p === 100) {
          setTimeout(() => setScreen('game'), 500);
        }
      }, i * 400));
    });

    return () => intervals.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-bg" />

      <div className="loading-content">
        <h1 className="loading-title">HELEONAIRE</h1>
        <p className="loading-subtitle">The Dark Age of Aethermor</p>

        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
          <span className="loading-percent">{progress}%</span>
        </div>

        <p className="loading-quote">{quote}</p>
      </div>
    </div>
  );
}
