import fs from "fs";
import path from "path";

export type User = { username: string; password: string; carModelId: number };

export type CarModel = {
  id: number;
  name: string;
  imageUrl: string;
};

const DATA_DIR = path.join(
  process.cwd(),
  "app",
  "(features)",
  "MyPSECar",
  "_data"
);

const CAR_MODELS_URL = process.env.CAR_MODELS_URL ?? "http://localhost:4001";

export function getUser(username: string): User | null {
  const users: User[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "users.json"), "utf-8")
  );
  return users.find((u) => u.username === username) ?? null;
}

export async function getCarModel(id: number): Promise<CarModel | null> {
  try {
    const res = await fetch(`${CAR_MODELS_URL}/api/car-models`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const cars: CarModel[] = await res.json();
    return cars.find((c) => c.id === id) ?? null;
  } catch {
    return null;
  }
}
