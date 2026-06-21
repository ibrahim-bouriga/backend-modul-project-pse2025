import * as THREE from "three";

export interface SpawnPoint {
  position: THREE.Vector3;
  yaw: number;
}

// ── Straßen-Querschnitt (alle Maße in Meter) ──────────────────
const LANE      = 3.5;           // eine Spur
const HALF      = LANE;          // Hälfte der Fahrbahnbreite (2 × 3.5 m = 7 m)
const CURB      = 0.18;          // Bordstein-Breite
const SW        = 2.0;           // Gehwegbreite
const RY        = 0.02;          // Fahrbahn Y
const CY        = 0.065;         // Bordstein Y
const SY        = 0.10;          // Gehweg Y
const MY        = 0.032;         // Markierungs-Y (über Fahrbahn)
const CL_W      = 0.10;          // Mittellinie Breite (gelb)
const EL_W      = 0.08;          // Randlinien Breite (weiß)

// ── Chunk-System ───────────────────────────────────────────────
const N_CHUNKS  = 90;            // Chunks insgesamt (geschlossene Schleife)
const SPR       = 6;             // Querschnitte pro Chunk-Ribbon
const AHEAD     = 12;            // Chunks voraus sichtbar  (~60 m)
const BEHIND    = 5;             // Chunks hinter dem Spieler

// ── Geteilte Materialien ───────────────────────────────────────
const M_ROAD = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
const M_CURB = new THREE.MeshLambertMaterial({ color: 0x555555 });
const M_SW   = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
const M_CL   = new THREE.MeshLambertMaterial({ color: 0xffdd00 }); // gelbe Mittellinie
const M_EL   = new THREE.MeshLambertMaterial({ color: 0xdddddd }); // weiße Randlinie
const M_TREE = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
const M_TRNK = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
const M_BLDG = new THREE.MeshLambertMaterial({ color: 0x6d7f8a });

const _UP = new THREE.Vector3(0, 1, 0);

interface Slice {
  c: THREE.Vector3;  // Kurvenmittelpunkt
  b: THREE.Vector3;  // Binormale (zeigt nach rechts)
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function slice(curve: THREE.CatmullRomCurve3, t: number): Slice {
  const c = curve.getPoint(t);
  const b = new THREE.Vector3()
    .crossVectors(_UP, curve.getTangent(t))
    .normalize();
  return { c, b };
}

/** Baut ein Ribbon-Mesh zwischen zwei Lateraloffsets entlang der Slices. */
function ribbon(
  slices: Slice[],
  lo: number, hi: number,
  y: number
): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  slices.forEach(({ c, b }, i) => {
    pos.push(
      c.x + b.x * lo, y, c.z + b.z * lo,
      c.x + b.x * hi, y, c.z + b.z * hi
    );
    if (i < slices.length - 1) {
      const a = i * 2;
      // CCW von oben → Normale zeigt nach +Y → von der Kamera sichtbar
      idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export class TrackGenerator {
  private scene: THREE.Scene;
  private rng: () => number;
  private nCP: number;
  private curve!: THREE.CatmullRomCurve3;
  private midPts: THREE.Vector3[] = [];   // Chunk-Mittelpunkte für Nearest-Suche
  private chunks: THREE.Group[] = [];
  private active = new Set<number>();
  private geos: THREE.BufferGeometry[] = [];

  constructor(
    scene: THREE.Scene,
    cfg: { seed?: number; controlPointCount?: number } = {}
  ) {
    this.scene = scene;
    this.rng = lcg(cfg.seed ?? 42);
    this.nCP = cfg.controlPointCount ?? 14;
  }

  generate(): SpawnPoint {
    this.curve = this.makeCurve();
    this.addGround();
    this.buildAllChunks();

    this.midPts = Array.from({ length: N_CHUNKS }, (_, i) =>
      this.curve.getPoint((i + 0.5) / N_CHUNKS)
    );

    const pos = this.curve.getPoint(0).clone();
    pos.y = 0;
    const tan = this.curve.getTangent(0);

    // Start-Chunks sofort aktivieren, nicht auf ersten Loop-Tick warten
    this.update(pos);

    return { position: pos, yaw: Math.atan2(-tan.x, -tan.z) };
  }

  /** Jeden Frame aufrufen – aktiviert/deaktiviert Chunks je nach Spielerposition. */
  update(playerPos: THREE.Vector3): void {
    const ci = this.nearest(playerPos);

    const want = new Set<number>();
    for (let d = -BEHIND; d <= AHEAD; d++) {
      want.add(((ci + d) % N_CHUNKS + N_CHUNKS) % N_CHUNKS);
    }

    want.forEach((i) => {
      if (!this.active.has(i)) {
        this.chunks[i].visible = true;
        this.active.add(i);
      }
    });

    // Nicht-mutierendes Entfernen: erst sammeln, dann löschen
    const toHide: number[] = [];
    this.active.forEach((i) => { if (!want.has(i)) toHide.push(i); });
    toHide.forEach((i) => {
      this.chunks[i].visible = false;
      this.active.delete(i);
    });
  }

  private nearest(pos: THREE.Vector3): number {
    let best = 0, bd = Infinity;
    for (let i = 0; i < N_CHUNKS; i++) {
      const p = this.midPts[i];
      const d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  private makeCurve(): THREE.CatmullRomCurve3 {
    const pts = Array.from({ length: this.nCP }, (_, i) => {
      const a = (i / this.nCP) * Math.PI * 2;
      const r = 75 + (this.rng() - 0.5) * 22;
      return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    });
    return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
  }

  private addGround(): void {
    const g = new THREE.PlaneGeometry(700, 700);
    this.geos.push(g);
    const mesh = new THREE.Mesh(
      g,
      new THREE.MeshLambertMaterial({ color: 0x4a8c3f })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private buildAllChunks(): void {
    for (let ci = 0; ci < N_CHUNKS; ci++) {
      const group = new THREE.Group();
      group.visible = false;

      const t0 = ci / N_CHUNKS;
      const t1 = (ci + 1) / N_CHUNKS;
      const slices: Slice[] = Array.from({ length: SPR + 1 }, (_, i) =>
        slice(this.curve, t0 + (t1 - t0) * (i / SPR))
      );

      const addMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = false) => {
        this.geos.push(geo);
        const m = new THREE.Mesh(geo, mat);
        m.receiveShadow = true;
        if (cast) m.castShadow = true;
        group.add(m);
      };

      // Fahrbahn
      addMesh(ribbon(slices, -HALF, HALF, RY), M_ROAD);

      // Bordsteine
      addMesh(ribbon(slices, -(HALF + CURB), -HALF, CY), M_CURB);
      addMesh(ribbon(slices, HALF, HALF + CURB, CY), M_CURB);

      // Gehwege
      addMesh(ribbon(slices, -(HALF + CURB + SW), -(HALF + CURB), SY), M_SW);
      addMesh(ribbon(slices, HALF + CURB, HALF + CURB + SW, SY), M_SW);

      // Mittellinie gelb (gestrichelt: jeder zweite Chunk)
      if (ci % 2 === 0) {
        addMesh(ribbon(slices, -CL_W / 2, CL_W / 2, MY), M_CL);
      }

      // Randlinien weiß
      addMesh(ribbon(slices, -HALF, -(HALF - EL_W), MY), M_EL);
      addMesh(ribbon(slices, HALF - EL_W, HALF, MY), M_EL);

      // Bäume entlang Gehweg
      const treeCount = 3 + Math.floor(this.rng() * 3);
      for (let k = 0; k < treeCount; k++) {
        const frac = t0 + (t1 - t0) * this.rng();
        const sl = slice(this.curve, frac);
        const side = this.rng() > 0.5 ? 1 : -1;
        // Bäume auf/hinter dem Gehweg
        const dist = HALF + CURB + SW * (0.4 + this.rng() * 0.6) + this.rng() * 3;
        const scale = 0.6 + this.rng() * 1.1;
        const px = sl.c.x + sl.b.x * side * dist;
        const pz = sl.c.z + sl.b.z * side * dist;

        const cg = new THREE.ConeGeometry(scale * 0.95, scale * 2.3, 6);
        const tg = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, scale * 0.7, 5);
        this.geos.push(cg, tg);

        const crown = new THREE.Mesh(cg, M_TREE);
        crown.position.set(px, SY + scale * 1.15 + scale * 0.35, pz);
        crown.rotation.y = this.rng() * Math.PI * 2;
        crown.castShadow = true;
        group.add(crown);

        const trunk = new THREE.Mesh(tg, M_TRNK);
        trunk.position.set(px, SY + scale * 0.35, pz);
        trunk.castShadow = true;
        group.add(trunk);
      }

      // Gebäude (ca. 45 % der Chunks)
      if (this.rng() < 0.45) {
        const frac = t0 + (t1 - t0) * (0.3 + this.rng() * 0.4);
        const sl = slice(this.curve, frac);
        const side = this.rng() > 0.5 ? 1 : -1;
        const dist = HALF + CURB + SW + 1.5 + this.rng() * 18;
        const w = 3 + this.rng() * 6;
        const h = 4 + this.rng() * 20;
        const d = 3 + this.rng() * 6;
        const bg = new THREE.BoxGeometry(w, h, d);
        this.geos.push(bg);
        const bldg = new THREE.Mesh(bg, M_BLDG);
        bldg.position.set(
          sl.c.x + sl.b.x * side * dist,
          h / 2,
          sl.c.z + sl.b.z * side * dist
        );
        bldg.rotation.y = this.rng() * Math.PI * 2;
        bldg.castShadow = true;
        bldg.receiveShadow = true;
        group.add(bldg);
      }

      this.scene.add(group);
      this.chunks.push(group);
    }
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose());
    this.geos = [];
  }
}
