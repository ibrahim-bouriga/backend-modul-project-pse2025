import { cookies } from "next/headers";
import Link from "next/link";
import TelemetryPanel from "./_components/TelemetryPanel";
import PhoneQRCode from "./_components/PhoneQRCode";
import LogoutButton from "./_components/LogoutButton";
import MyCarCard from "./_components/MyCarCard";
import { getUser, getCarModel } from "./_lib/data";
import { Suspense } from "react";

async function MyPSECarContent() {
  const cookieStore = await cookies();
  const username = cookieStore.get("session")?.value ?? null;

  if (!username) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-16">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
          Feature Module
        </p>
        <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-6">
          MyPSECar
        </h1>
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 max-w-lg">
          <p className="text-zinc-400 text-base leading-relaxed mb-6">
            Du bist nicht angemeldet. Melde dich an, um dein Fahrzeug-Dashboard
            mit Tankstand, Live-Position und Handy-Anbindung zu sehen.
          </p>
          <Link
            href="/MyPSECar/login"
            className="inline-block bg-white text-black font-black uppercase tracking-widest text-sm px-6 py-3 rounded-xl hover:bg-zinc-200 transition"
          >
            Anmelden →
          </Link>
        </div>
      </div>
    );
  }

  const user = getUser(username);
  const car = user ? await getCarModel(user.carModelId) : null;

  return (
    <div className="max-w-4xl mx-auto px-8 py-16 space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
            Feature Module
          </p>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
            MyPSECar
          </h1>
          <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
            Willkommen,{" "}
            <span className="text-white font-semibold">{username}</span>. Hier
            siehst du Tankstand und Live-Position deines Fahrzeugs — Daten
            kommen in Echtzeit per MQTT.
          </p>
        </div>
        <LogoutButton />
      </div>

      {car ? (
        <MyCarCard car={car} />
      ) : (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-zinc-400 text-sm">
          Fahrzeugbild konnte nicht geladen werden. Läuft{" "}
          <code className="text-zinc-300">car_models</code> auf Port 4001?
        </div>
      )}

      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <PhoneQRCode />
      </div>

      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
        <TelemetryPanel />
      </div>
    </div>
  );
}

export default function MyPSECarPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500">Loading MyPSECar…</div>}>
      <MyPSECarContent />
    </Suspense>
  );
}
