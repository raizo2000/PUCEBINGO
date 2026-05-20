import { GameScreen } from "@/components/game/GameScreen";

export default function HomePage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Pantalla de partida
        </h1>
        <p className="mt-1 text-slate-400">
          Sorteo en vivo optimizado para proyectores y pantallas grandes
        </p>
      </header>
      <GameScreen />
    </>
  );
}
