import fs from "fs";
import path from "path";

export type User = { username: string; password: string; carId: string };
export type Car = { name: string; image: string };

const DATA_DIR = path.join(
  process.cwd(),
  "app",
  "(features)",
  "MyPSECar",
  "_data"
);

export function getUser(username: string): User | null {
  const users: User[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "users.json"), "utf-8")
  );
  return users.find((u) => u.username === username) ?? null;
}

export function getCar(carId: string): Car | null {
  const cars: Record<string, Car> = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "cars.json"), "utf-8")
  );
  return cars[carId] ?? null;
}
