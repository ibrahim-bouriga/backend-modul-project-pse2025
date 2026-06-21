import * as THREE from "three";

export interface InteriorParts {
  group: THREE.Group;
  steeringWheel: THREE.Object3D; // Group – CarController animiert rotation.z
  rearviewSurface: THREE.Mesh; // reiner Platzhalter, kein RTT
  leftMirrorSurface: THREE.Mesh; // reiner Platzhalter, kein RTT
  rightMirrorSurface: THREE.Mesh; // reiner Platzhalter, kein RTT
}

// ── Referenzpunkte ─────────────────────────────────────────────────
// Alle Maße in Metern, relativ zur Kameraposition (0,0,0).
// Z negativ = vor dem Fahrer, Y positiv = oben, X positiv = rechts.
//
// DRIVER_X leicht von -0.35 auf -0.30 angepasst – ermöglicht einen saubereren,
// weniger extremen Lenksäulen-Winkel zwischen Dashboard und Lenkrad.
export const DRIVER_X = -0.3;

// rotation.x für Windschutzscheibe/A-Säulen. Positiv = der lokal obere Rand
// (+y) wandert nach +Z (nach hinten, zum Fahrer) – das ist die korrekte
// Richtung für eine nach hinten geneigte Frontscheibe. Verifiziert anhand
// Screenshot: negatives Vorzeichen kippt die Scheibe sichtbar nach vorne weg.
const WS_TILT = 0.42;

// Windschutzscheiben-Eckpunkte (vor Rotation, lokale Box-Maße)
const WS_WIDTH = 1.52;
const WS_HEIGHT = 0.645;
const WS_PIVOT_Y = 1.145;
const WS_PIVOT_Z = -0.86;

// ── Materialien ──────────────────────────────────────────────────
const M_TRIM = new THREE.MeshLambertMaterial({ color: 0x2b2b2e }); // A-Säulen/Dach/Rahmen
const M_DBODY = new THREE.MeshLambertMaterial({ color: 0x35363a }); // Armaturenbrett-Körper
const M_PANEL = new THREE.MeshLambertMaterial({ color: 0x3d3d40 }); // Türverkleidung
const M_SEAT = new THREE.MeshLambertMaterial({ color: 0x4a3320 }); // Sitze, wärmerer Ton
const M_GLASS = new THREE.MeshLambertMaterial({
  color: 0x9fc3df,
  transparent: true,
  opacity: 0.16,
  side: THREE.DoubleSide,
});
const M_SCREEN = new THREE.MeshBasicMaterial({ color: 0x0d2a4a });

const M_COLUMN = new THREE.MeshStandardMaterial({
  color: 0x55565a,
  roughness: 0.55,
  metalness: 0.25,
});
const M_RIM = new THREE.MeshStandardMaterial({
  color: 0x1f1f22,
  roughness: 0.4,
  metalness: 0.15,
});
const M_HUB = new THREE.MeshStandardMaterial({
  color: 0x7a7b80,
  roughness: 0.4,
  metalness: 0.35,
});

// Reine Platzhalter-Spiegelflächen: heller/reflektierender wirkend, aber
// ohne RTT – ein helles, leicht bläuliches Grau mit etwas Glanz simuliert
// eine reflektierende Oberfläche ohne tatsächliches Spiegelbild.
function makeMirrorMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x8a98a8,
    roughness: 0.25,
    metalness: 0.6,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

function bx(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(px, py, pz);
  if (rx !== 0) m.rotation.x = rx;
  return m;
}

function mirrorPlane(w: number, h: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeMirrorMaterial());
}

/**
 * Erstellt einen Zylinder, der exakt zwischen zwei Punkten verläuft.
 * Rotation wird aus dem tatsächlichen Richtungsvektor berechnet (Quaternion),
 * keine geschätzten Eulerwinkel – verhindert Versatz zwischen Bauteilen,
 * die aneinander anschließen müssen.
 */
function cylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radiusStart: number,
  radiusEnd: number,
  mat: THREE.Material,
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusEnd, radiusStart, len, 8),
    mat,
  );
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  return mesh;
}

export function buildInterior(): InteriorParts {
  const group = new THREE.Group();
  const DX = DRIVER_X;

  // ── Cockpit-Innenlicht ────────────────────────────────────────
  // Das Hauptlicht der Szene kommt von außen/oben und wird vom eigenen Dach
  // verschattet – ohne eigenes Licht bleibt das Cockpit kontrastlos dunkel.
  const cabinLight = new THREE.PointLight(0xfff2dd, 0.9, 3.5, 2);
  cabinLight.position.set(0, 1.55, -0.3);
  group.add(cabinLight);

  const fillLight = new THREE.PointLight(0xcfe0ff, 0.4, 2.5, 2);
  fillLight.position.set(DX, 0.95, 0.1);
  group.add(fillLight);

  // ── Windschutzscheibe + Rahmen ────────────────────────────────
  // Pivot bei (WS_PIVOT_Y, WS_PIVOT_Z), Höhe WS_HEIGHT, Rotation WS_TILT.
  // Unterer Rand (lokal -y) wandert nach -Z (vorne), oberer Rand (lokal +y)
  // nach +Z (zum Fahrer) – ergibt die korrekt nach hinten geneigte Form.
  group.add(
    bx(WS_WIDTH, WS_HEIGHT, 0.015, M_GLASS, 0, WS_PIVOT_Y, WS_PIVOT_Z, WS_TILT),
  );
  group.add(
    bx(
      WS_WIDTH,
      0.045,
      0.04,
      M_TRIM,
      0,
      WS_PIVOT_Y + WS_HEIGHT / 2,
      WS_PIVOT_Z,
      WS_TILT,
    ),
  ); // oberer Rahmen
  group.add(
    bx(
      WS_WIDTH,
      0.035,
      0.04,
      M_TRIM,
      0,
      WS_PIVOT_Y - WS_HEIGHT / 2,
      WS_PIVOT_Z,
      WS_TILT,
    ),
  ); // unterer Rahmen
  group.add(
    bx(
      0.065,
      WS_HEIGHT,
      0.05,
      M_TRIM,
      -WS_WIDTH / 2 + 0.03,
      WS_PIVOT_Y,
      WS_PIVOT_Z,
      WS_TILT,
    ),
  );
  group.add(
    bx(
      0.065,
      WS_HEIGHT,
      0.05,
      M_TRIM,
      WS_WIDTH / 2 - 0.03,
      WS_PIVOT_Y,
      WS_PIVOT_Z,
      WS_TILT,
    ),
  );

  // A-Säulen-Endpunkt (oberer Rand) explizit berechnet, nicht geschätzt –
  // wird sowohl für das Dach als auch den Rückspiegel als Referenz genutzt.
  const aPillarTopY = WS_PIVOT_Y + (WS_HEIGHT / 2) * Math.cos(WS_TILT);
  const aPillarTopZ = WS_PIVOT_Z + (WS_HEIGHT / 2) * Math.sin(WS_TILT);

  // ── Dach ──────────────────────────────────────────────────────
  // WICHTIG: Eine rotierte A-Säule (WS_TILT) und ein unrotiertes Dach (0°)
  // können sich an einer einzelnen mathematischen Kante nie nahtlos treffen,
  // da ihre Flächen in unterschiedlichen Winkeln enden – egal wie exakt der
  // Punkt berechnet ist, bleibt ein keilförmiger Spalt. Lösung: Dach bewusst
  // nach vorne überlappend, sodass es die A-Säulen-Spitze von oben verdeckt,
  // statt an ihr zu enden.
  const roofDepth = 1.0;
  const roofThickness = 0.07;
  const roofOverlap = 0.08;
  const roofWidth = 1.7; // von 1.60 auf 1.70 erhöht, zusätzliche Sicherheitsmarge seitlich
  group.add(
    bx(
      roofWidth,
      roofThickness,
      roofDepth + roofOverlap,
      M_TRIM,
      0,
      aPillarTopY + 0.01,
      aPillarTopZ + roofDepth / 2 - roofOverlap / 2,
    ),
  );

  // ── Innenrückspiegel ──────────────────────────────────────────
  // Position explizit UNTER der tatsächlichen Dach-Unterkante berechnet
  // (roofBottomY), statt an einem von der Dach-Position unabhängigen Wert –
  // verhindert, dass der Spiegel im Dach-Volumen verschwindet.
  const roofBottomY = aPillarTopY + 0.01 - roofThickness / 2;
  const mirrorMountY = roofBottomY - 0.025;
  const mirrorMountZ = aPillarTopZ + 0.04;
  group.add(
    bx(0.22, 0.07, 0.03, M_TRIM, 0, mirrorMountY, mirrorMountZ, WS_TILT),
  );
  group.add(
    cylinderBetween(
      new THREE.Vector3(0, roofBottomY, mirrorMountZ - 0.01),
      new THREE.Vector3(0, mirrorMountY + 0.03, mirrorMountZ - 0.01),
      0.008,
      0.008,
      M_TRIM,
    ),
  );

  const rearviewSurface = mirrorPlane(0.19, 0.05);
  rearviewSurface.position.set(0, mirrorMountY, mirrorMountZ + 0.016);
  rearviewSurface.rotation.x = WS_TILT;
  group.add(rearviewSurface);

  // ── Armaturenbrett ──────────────────────────────────────────────
  const dashY = 0.72;
  const dashZ = -0.7;
  group.add(bx(1.55, 0.24, 0.48, M_DBODY, 0, dashY, dashZ, 0.08));
  group.add(bx(1.55, 0.04, 0.06, M_HUB, 0, dashY + 0.115, dashZ + 0.03, 0.08)); // helle Vorderkante

  group.add(
    bx(0.4, 0.11, 0.055, M_TRIM, DX + 0.06, dashY + 0.14, dashZ + 0.04),
  );
  group.add(
    bx(0.34, 0.082, 0.005, M_SCREEN, DX + 0.06, dashY + 0.14, dashZ + 0.065),
  );
  group.add(
    bx(0.24, 0.15, 0.04, M_TRIM, 0.05, dashY + 0.095, dashZ + 0.06, 0.08),
  );
  group.add(
    bx(0.2, 0.118, 0.005, M_SCREEN, 0.05, dashY + 0.095, dashZ + 0.08, 0.08),
  );

  for (const vx of [-0.52, -0.2, 0.3, 0.52]) {
    group.add(bx(0.09, 0.038, 0.012, M_TRIM, vx, dashY + 0.122, dashZ + 0.02));
    group.add(bx(0.07, 0.025, 0.005, M_HUB, vx, dashY + 0.122, dashZ + 0.025));
  }

  // ── Lenksäule + Lenkrad: ein zusammenhängender Aufbau ──────────
  // Beide Endpunkte werden explizit definiert. Die Säule verläuft exakt
  // zwischen Dashboard und Lenkrad-Mittelpunkt; das Lenkrad wird DANACH an
  // genau diesem Endpunkt positioniert, mit Neigung relativ zur Säule statt
  // einem unabhängig geschätzten Wert – verhindert den Versatz, der bei
  // unabhängig kalibrierten Bauteilen mehrfach aufgetreten ist.
  const colStart = new THREE.Vector3(DX, dashY + 0.1, dashZ + 0.12);
  const colEnd = new THREE.Vector3(DX, 0.95, -0.58);

  group.add(cylinderBetween(colStart, colEnd, 0.028, 0.022, M_COLUMN));

  // Lenkrad-Neigung relativ zur Säulenrichtung: die Säule selbst zeigt schon
  // schräg nach oben-vorne; das Lenkrad wird zusätzlich leicht nach vorne
  // geneigt (positiv = Vorderseite zeigt zum Fahrer, verifiziert anhand
  // Screenshot in vorheriger Iteration).
  const wheelTilt = -0.3;

  const steeringWheel = new THREE.Group();
  steeringWheel.position.copy(colEnd);
  steeringWheel.rotation.x = wheelTilt;

  const RING_R = 0.135;
  const TUBE_R = 0.014;
  const HUB_R = 0.045;

  // Voller Ring – kein D-Cut. Robuster, weniger Rotations-Fehlerquellen,
  // und für ein Sportwagen-Cockpit optisch weiterhin überzeugend.
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(RING_R, TUBE_R, 12, 32),
    M_RIM,
  );
  steeringWheel.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(HUB_R, HUB_R, 0.022, 12),
    M_HUB,
  );
  hub.rotation.x = Math.PI / 2;
  steeringWheel.add(hub);

  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.06, 0.018),
    M_HUB,
  );
  cover.position.z = 0.012;
  steeringWheel.add(cover);

  // 3 Speichen bei 90° (oben) und ±30° von unten (210°, 330°) – stabile,
  // unkomplizierte Y-Achsen-Anordnung statt rotations-abhängiger Lücke.
  const spokeLen = RING_R - HUB_R;
  const spokeMid = HUB_R + spokeLen / 2;
  for (const deg of [90, 210, 330]) {
    const a = (deg * Math.PI) / 180;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, spokeLen, 0.014),
      M_RIM,
    );
    spoke.position.set(Math.cos(a) * spokeMid, Math.sin(a) * spokeMid, 0);
    spoke.rotation.z = a - Math.PI / 2;
    steeringWheel.add(spoke);
  }

  group.add(steeringWheel);

  // ── Türen ─────────────────────────────────────────────────────
  // KORREKTUR: Der vorherige Wert (doorTopY=1.16) war tatsächlich HÖHER als
  // die ursprüngliche Hauptverkleidung (die bei 0.52+1.05/2=1.045 endete) –
  // ich hatte sie fälschlich mit der separaten, höher sitzenden Rahmenleiste
  // (≈1.389) verglichen statt mit der tatsächlich sichtbaren Wand. Jetzt
  // deutlich UNTER den ursprünglichen 1.045 gesetzt, um wirklich niedriger
  // zu werden – Fensterlinie jetzt bei y=0.95, klar unter Augenhöhe (1.2).
  const doorTopY = 0.95;
  const doorBottomY = 0.0;
  const doorPanelHeight = doorTopY - doorBottomY;
  for (const side of [-1, 1]) {
    const doorX = side * 0.84;
    group.add(
      bx(
        0.062,
        doorPanelHeight,
        1.4,
        M_PANEL,
        doorX,
        doorBottomY + doorPanelHeight / 2,
        -0.3,
      ),
    );
    group.add(
      bx(0.05, 0.04, 1.1, M_TRIM, doorX - side * 0.006, doorTopY, -0.05),
    );
    group.add(
      bx(0.086, 0.055, 0.46, M_TRIM, doorX - side * 0.038, 0.715, -0.16),
    );
  }

  // ── Seitlicher Dachholm (verbindet A-Säule mit Türrahmen) ──────
  // Großzügige Übergangsbox, aber nach vorne gekürzt: vorheriger Z-Bereich
  // (-0.95 bis -0.35) ragte vorne bis -0.95 und damit über die Windschutz-
  // scheibe (vorderster Punkt ≈ -0.86 bis -0.97) hinaus – sichtbar als
  // Balken vor dem Auto. Neuer Bereich: -0.78 bis -0.35, bleibt hinter der
  // Scheibe, behält aber das hintere Ende bei, das die Lücke zur Tür schloss.
  for (const side of [-1, 1]) {
    const doorX = side * 0.84;
    group.add(
      bx(
        0.07,
        0.09,
        0.43,
        M_TRIM,
        doorX - side * 0.01,
        aPillarTopY - 0.02,
        -0.565,
      ),
    );
  }

  // ── Außenspiegel ────────────────────────────────────────────────
  // Rotation: 90° war zu extrem und drehte das Gehäuse faktisch quer zur
  // Kamera (wirkte "eingeklappt"/unsichtbar). Korrekter, vom Nutzer
  // verifizierter Wert: 18° (π/10) – eine leichte Neigung nach außen statt
  // einer vollen Vierteldrehung.
  const mirrorY = 1.05;
  let leftMirrorSurface!: THREE.Mesh;
  let rightMirrorSurface!: THREE.Mesh;

  for (const side of [-1, 1]) {
    const mx = side * 0.95;
    // Verbindungsarm bleibt unrotiert, fest an der Tür-Oberkante verankert
    group.add(bx(0.035, 0.12, 0.04, M_TRIM, mx - side * 0.02, 1.0, -0.75));

    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(mx, mirrorY, -0.75);
    mirrorGroup.rotation.y = side < 0 ? Math.PI / 10 : -Math.PI / 10;

    const housing = bx(0.13, 0.085, 0.1, M_TRIM, 0, 0, 0);
    mirrorGroup.add(housing);

    const surf = mirrorPlane(0.105, 0.07);
    surf.position.set(0, 0, 0.052); // an der Außenseite des (jetzt rotierten) Gehäuses
    mirrorGroup.add(surf);

    group.add(mirrorGroup);
    if (side < 0) leftMirrorSurface = surf;
    else rightMirrorSurface = surf;
  }

  // ── Sitze ─────────────────────────────────────────────────────
  for (const sx of [DX, 0.4]) {
    group.add(bx(0.47, 0.09, 0.5, M_SEAT, sx, 0.575, 0.18));
    group.add(bx(0.47, 0.7, 0.07, M_SEAT, sx, 0.96, 0.4));
    group.add(bx(0.33, 0.21, 0.07, M_SEAT, sx, 1.34, 0.4));
  }
  group.add(bx(0.22, 0.2, 0.55, M_TRIM, (DX + 0.4) / 2, 0.61, 0.05)); // Mittelkonsole

  return {
    group,
    steeringWheel,
    rearviewSurface,
    leftMirrorSurface,
    rightMirrorSurface,
  };
}
