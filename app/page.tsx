import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Bienvenida al Salón de Uñas</h1>
      <Link href="/reserva">Reservar una cita</Link>
    </main>
  );
}
