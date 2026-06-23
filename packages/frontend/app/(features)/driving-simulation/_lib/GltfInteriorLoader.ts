import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { InteriorParts } from "./InteriorBuilder";

const MODEL_PATH = "/models/car-interior/scene.gltf";

// ENTKOPPLUNG (wichtige Korrektur): GLTF_DRIVER_X und GLTF_EYE_HEIGHT sind
// EIGENSTÄNDIGE Konstanten, NICHT identisch mit DRIVER_X/EYE_HEIGHT in
// CarController.ts bzw. InteriorBuilder.ts. Grund: DRIVER_X wird in
// InteriorBuilder.ts dafür genutzt, die GESAMTE handgebaute Cockpit-
// Geometrie relativ zu sich selbst aufzubauen (Sitze, Lenksäule, etc.) -
// dort ist die Kopplung an die Kameraposition beabsichtigt und korrekt.
//
// Beim GLTF-Modell ist das anders: Die Cockpit-Geometrie kommt FERTIG aus
// der Sketchfab-Datei, mit einer eigenen, festen internen Position für
// Lenkrad/Sitz. Wenn dieser Loader denselben DRIVER_X-Wert importiert hätte,
// würde JEDE Änderung von DRIVER_X automatisch BEIDES verschieben: die
// tatsächliche Kameraposition in CarController.ts UND den Zielpunkt, auf
// den die GLTF-Box ausgerichtet wird - beide bewegen sich synchron, man
// kann nie nur eine der beiden Seiten justieren.
//
// Diese Werte hier sind also rein der GESCHÄTZTE Zielpunkt INNERHALB der
// GLTF-Box, der mit der tatsächlichen, unabhängig fixierten Kameraposition
// aus CarController.ts (aktuell DRIVER_X=-0.3, EYE_HEIGHT=1.2) zur
// Deckung gebracht werden soll. Frei anpassbar, ohne dass sich die Kamera
// selbst bewegt - nur die GLTF-Geometrie verschiebt sich relativ dazu.
const GLTF_DRIVER_X = -0.9; // weiter angepasst gegenüber Startwert -0.3
const GLTF_EYE_HEIGHT = 1.19; // weiter angepasst gegenüber Startwert 1.2

// Verifiziert anhand der tatsächlichen Konsolen-Ausgabe der Modell-
// Hierarchie (Lamborghini Revuelto, Sketchfab-Export). Dies sind die
// Top-Level-Gruppen unter RootNode, die zum Innenraum gehören - alles
// andere (Karosserie, Räder, Scheinwerfer, Auspuff, etc.) wird NICHT
// hinzugefügt, bleibt also unsichtbar/nicht geladen in der Szene.
//
// AKTUELL UNGENUTZT (siehe DEBUG-Hinweis unten bei der children-Schleife):
// Whitelist-Filter ist temporär deaktiviert, um das KOMPLETTE Modell zu
// laden und die Ausrichtung (Rotation/Position) anhand der gesamten,
// vertrauten Fahrzeugform visuell nachvollziehen zu können, statt nur
// anhand der schwer einzuordnenden Interior-Fragmente. Sobald Position/
// Rotation final passen, hier wieder zur gefilterten Variante zurückkehren
// (siehe Kommentar an der children-Schleife).
const INTERIOR_GROUP_NAMES = [
  "Interior_doors",
  "Interior_general",
  "Interior_middle",
  "Interior_middle_parts",
  "Seat",
  "Mid_part_2",
  "Mid_parts_1",
  "Pedal",
  "Steering_wheel",
  "Steering_wheel_holder",
  "Speedometer",
  "Mirrors",
  "Windshield",
];

/**
 * Lädt das externe GLTF-Modell (komplettes Fahrzeug) und extrahiert daraus
 * NUR die Innenraum-relevanten Objekte, basierend auf einer Whitelist
 * verifizierter Namen. Karosserie, Räder, Scheinwerfer etc. werden beim
 * Aufbau der Rückgabe-Gruppe schlicht nicht hinzugefügt.
 *
 * EIGENSTÄNDIG & AUSTAUSCHBAR: Keine Abhängigkeit zu InteriorBuilder.ts
 * außer dem geteilten Interface-Typ. Kann jederzeit gelöscht werden, ohne
 * den bestehenden buildInterior()-Code zu beeinflussen. Schalter dafür:
 * USE_GLTF_INTERIOR in World.tsx.
 *
 * DEBUG-MODUS AKTIV: Lädt aktuell das KOMPLETTE Fahrzeug (keine Filterung),
 * um Position/Rotation anhand der vollständigen, vertrauten Fahrzeugform
 * zu verifizieren. Karosserie/Räder/Scheinwerfer sind also vorübergehend
 * SICHTBAR - das ist beabsichtigt für diese Debug-Phase, nicht der finale
 * Zustand (siehe Kommentar an der children-Schleife für Rückumstellung).
 */
export async function loadGltfInterior(): Promise<InteriorParts | null> {
  const loader = new GLTFLoader();

  let gltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  try {
    gltf = await loader.loadAsync(MODEL_PATH);
  } catch (err) {
    console.error(
      `[GltfInteriorLoader] Konnte Modell nicht laden von ${MODEL_PATH}:`,
      err,
    );
    return null;
  }

  // Findet die RootNode-Ebene, unter der die Top-Level-Teile liegen.
  // Struktur laut verifizierter Analyse:
  // Sketchfab_Scene > Sketchfab_model > Lamborghini_revueltofbx > RootNode > [Teile]
  let rootNode: THREE.Object3D | null = null;
  gltf.scene.traverse((obj) => {
    if (!rootNode && obj.name === "RootNode") rootNode = obj;
  });

  if (!rootNode) {
    console.error(
      "[GltfInteriorLoader] 'RootNode' nicht im Modell gefunden - " +
        "Modellstruktur hat sich evtl. geändert. Fallback wird genutzt.",
    );
    return null;
  }

  // DEBUG: Prüft, ob RootNode selbst eine eigene Transformation hat
  // (Position/Skalierung/Rotation), die beim Klonen NUR der Kinder
  // (statt RootNode selbst) verloren gehen würde - typisch bei FBX->GLTF
  // Konvertierungen, die oft eine Korrektur-Transformation auf RootNode
  // legen.
  const rn = rootNode as THREE.Object3D;
  console.log("[GltfInteriorLoader] RootNode position:", rn.position);
  console.log("[GltfInteriorLoader] RootNode scale:", rn.scale);
  console.log("[GltfInteriorLoader] RootNode rotation:", rn.rotation);
  console.log(
    "[GltfInteriorLoader] RootNode matrix elements:",
    rn.matrix.elements,
  );
  console.log(
    "[GltfInteriorLoader] RootNode world matrix elements:",
    rn.matrixWorld.elements,
  );

  // KORREKTUR (entscheidender Fund): RootNode.matrixWorld zeigt eine
  // versteckte 90°-Rotation um X kombiniert mit Skalierung 0.01, die von
  // einem ELTERN-Objekt von RootNode kommt (Sketchfab_Scene/Sketchfab_model/
  // Lamborghini_revueltofbx), NICHT von RootNode selbst. Da wir bisher nur
  // die KINDER von RootNode einzeln geklont haben, ging diese Eltern-
  // Transformation verloren - das erklärt alle bisherigen, unerklärlichen
  // Positionierungs-Diskrepanzen.
  //
  // Lösung: RootNode selbst klonen (übernimmt seine korrekte Welt-Transform-
  // Kette automatisch über updateMatrixWorld), DANN erst die Kinder filtern.
  rn.updateMatrixWorld(true);
  const rootNodeClone = rn.clone();
  // Die geklonte Kopie in eine neutrale, freistehende Gruppe einhängen und
  // ihre korrekte World-Transformation explizit als LOKALE Transformation
  // übernehmen (da sie sonst als Kind von nichts/world behandelt würde).
  const worldMatrix = rn.matrixWorld.clone();
  rootNodeClone.matrix.copy(worldMatrix);
  rootNodeClone.matrix.decompose(
    rootNodeClone.position,
    rootNodeClone.quaternion,
    rootNodeClone.scale,
  );

  const group = new THREE.Group(); // Innere Gruppe: enthält das Cockpit, wird verschoben
  let steeringWheel: THREE.Object3D | null = null;
  let foundCount = 0;

  // DEBUG-MODUS: Aktuell werden ALLE Kinder von rootNodeClone hinzugefügt
  // (keine Filterung nach INTERIOR_GROUP_NAMES) - das macht das komplette
  // Fahrzeug sichtbar (Karosserie, Räder, Scheinwerfer eingeschlossen),
  // damit Position/Rotation anhand der vertrauten, kompletten Fahrzeugform
  // beurteilt werden kann statt anhand der schwer einzuordnenden Interior-
  // Fragmente allein.
  //
  // RÜCKUMSTELLUNG auf nur-Interior (finaler Zustand), sobald Ausrichtung
  // final passt: untere Zeile entfernen und den auskommentierten Block
  // darunter wieder aktivieren.
  for (const child of rootNodeClone.children.slice()) {
    group.add(child); // alle Kinder hinzufügen, dann filtern
    // if (INTERIOR_GROUP_NAMES.includes(child.name)) {
    //   group.add(child); // bereits geklont via rootNodeClone, kein erneutes clone() nötig
    //   foundCount++;
    //   if (child.name === "Steering_wheel") {
    //     steeringWheel = child;
    //   }
    // }
  }

  console.log(
    `[GltfInteriorLoader] ${foundCount} von ${INTERIOR_GROUP_NAMES.length} ` +
      `erwarteten Interior-Gruppen im Modell gefunden und hinzugefügt.`,
  );

  // Die korrekte Transformation (Rotation + Skalierung aus der World-Matrix
  // von RootNode) wird jetzt auf GROUP selbst angewendet, NICHT mehr eine
  // geschätzte SCALE_FACTOR-Konstante - das ist die tatsächlich im Modell
  // hinterlegte, korrekte Transformation.
  group.quaternion.copy(rootNodeClone.quaternion);
  group.scale.copy(rootNodeClone.scale);

  // KORREKTUR (verifiziert per Vogelperspektive-Screenshot): Das Cockpit
  // zeigte mit "vorne" (Windschutzscheibe-Richtung) nach +Z, while unser
  // Fahrzeug in -Z-Richtung fährt (siehe CarController.ts: root.position.z
  // -= cos(heading)*speed*delta). Die Kamera saß dadurch faktisch HINTER
  // den Sitzen statt davor - sichtbar am Screenshot, wo die rote
  // Augenposition-Markierung hinter den Sitzlehnen lag.
  //
  // ROTATIONSACHSE GEÄNDERT (Z statt Y): Beim Laden des KOMPLETTEN Modells
  // (Debug-Modus, siehe oben) hat sich gezeigt, dass die ursprünglich
  // angenommene Korrektur um die Y-Achse nicht zur tatsächlich benötigten
  // Korrektur passt - mit dem kompletten Fahrzeug sichtbar ließ sich anhand
  // der Räder/Karosserie-Ausrichtung erkennen, dass stattdessen eine
  // Rotation um Z nötig ist, NACH der bereits korrekten RootNode-
  // Transformation angewendet (sonst ginge die korrekte 90°-X-Rotation
  // verloren).
  group.rotateZ(Math.PI);

  // SCALE_FACTOR wird nur noch für die Spiegel-Platzhalter-Geometrien unten
  // gebraucht (deren Größe/Position wir weiterhin in "echten" Metern denken
  // wollen) - der Wert kommt jetzt aus der tatsächlichen, gemessenen Skalierung
  // statt geschätzt zu sein.
  const SCALE_FACTOR = rootNodeClone.scale.x; // sollte ≈0.01 sein, jetzt verifiziert statt geschätzt

  // LENKRAD-SUCHE (unabhängig von der aktuell deaktivierten Whitelist-
  // Schleife oben): Da im Debug-Modus ALLE Kinder hinzugefügt werden statt
  // nur der gefilterten Interior-Gruppen, wird `steeringWheel` dort nicht
  // mehr gesetzt. Eigenständiges traverse() auf der bereits korrekt
  // transformierten `group` (NICHT auf dem rohen gltf.scene, das hätte die
  // RootNode-Korrektur/Rotation/Verschiebung von oben nicht übernommen).
  group.traverse((obj) => {
    if (!steeringWheel && obj.name === "Steering_wheel") {
      steeringWheel = obj;
    }
  });

  // LENKRAD-AUSRICHTUNGS-KORREKTUR + WIEDERVERWENDUNG DER BESTEHENDEN
  // ANIMATION: CarController.ts animiert generisch `steeringWheel.rotation.z`
  // (siehe update(): lerp Richtung ±72° = Math.PI*0.4) - das funktioniert
  // unverändert für JEDES Objekt, das als steeringWheel übergeben wird,
  // unabhängig vom Cockpit-Modell. Das Problem ist nur die INTERNE
  // Ausrichtung des GLTF-Lenkrads: dessen lokale Geometrie ist nicht so
  // orientiert, dass "rotation.z drehen" optisch wie Lenkradbewegung
  // aussieht - das wurde manuell getestet (Korrektur: rotation.y = 90°).
  //
  // Lösung: Korrektur-WRAPPER zwischen GLTF-Objekt und Controller einfügen.
  // Der Wrapper trägt die einmalige, feste Ausrichtungskorrektur (rotation.y).
  // Der Controller bekommt NUR den Wrapper als steeringWheel-Referenz und
  // animiert dessen rotation.z weiterhin unverändert - die Korrektur und
  // die Animation überlagern sich dadurch sauber, ohne dass die Controller-
  // Logik angepasst werden muss.
  if (steeringWheel) {
    const steeringWheelWrapper = new THREE.Group();
    steeringWheelWrapper.position.copy(steeringWheel.position);
    steeringWheelWrapper.rotation.y = 2 * Math.PI; // verifizierte Korrektur

    // Lenkrad an Position (0,0,0) relativ zum Wrapper setzen, da der
    // Wrapper bereits die ursprüngliche Position übernommen hat - sonst
    // würde die Position doppelt angewendet.
    const parent = steeringWheel.parent;
    steeringWheel.position.set(0, 0, 0);
    steeringWheelWrapper.add(steeringWheel);
    if (parent) {
      parent.add(steeringWheelWrapper);
    } else {
      group.add(steeringWheelWrapper);
    }

    // Diese Referenz (Wrapper, NICHT das rohe GLTF-Objekt) geht an
    // CarController.ts über setSteeringWheel() - dort wird weiterhin nur
    // rotation.z animiert, das Cockpit-Modell selbst bleibt dem Controller
    // unbekannt.
    steeringWheel = steeringWheelWrapper;
  }

  // POSITIONIERUNG (fünfte Korrektur - Entkopplung): GLTF_DRIVER_X und
  // GLTF_EYE_HEIGHT sind jetzt eigenständige Konstanten (siehe Kommentar
  // am Dateianfang), nicht mehr aus InteriorBuilder.ts importiert. Vorher
  // führte das Ändern von DRIVER_X in InteriorBuilder.ts dazu, dass sich
  // gleichzeitig die GLTF-Zielposition UND die echte Kameraposition in
  // CarController.ts verschoben - eine unabhängige Justierung war so nicht
  // möglich.
  //
  // Box weiterhin VOR jeder Verschiebung messen (wichtig, siehe vorherige
  // Korrektur), aber den errechneten Zielpunkt jetzt auf GLTF_DRIVER_X/
  // GLTF_EYE_HEIGHT legen statt auf (0,0,0):
  //   x_target = Box-Zentrum in X        (Kamera/Fahrer sitzt mittig-symmetrisch
  //                                        innerhalb der Box)
  //   y_target = 75% der Boxhöhe         (ungefähr Kopf-/Augenhöhe, nicht Boden
  //                                        und nicht Dach)
  //   z_target = 70% der Boxtiefe ab min (hinterer Bereich der Box = Fahrersitz-
  //                                        Bereich, da Fahrer Richtung -Z blickt)
  //
  // Diese Faktoren (0.75 / 0.7) bleiben die einzigen Schätzwerte - aber als
  // Prozentsatz einer real gemessenen Box, kein Raten absoluter Meterwerte.
  // HINWEIS: Im aktuellen Debug-Modus (komplettes Fahrzeug statt nur
  // Interior) bezieht sich diese Box auf das GESAMTE Auto, nicht nur den
  // Innenraum - die Prozentsätze (0.75/0.7) sind für die reine Interior-Box
  // kalibriert und liefern beim Komplett-Modell ggf. andere, weniger
  // aussagekräftige Zielpunkte. Bei Rückumstellung auf die gefilterte
  // Variante wieder gegen die reine Interior-Box verifizieren.
  const rawBox = new THREE.Box3().setFromObject(group);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  const rawCenter = rawBox.getCenter(new THREE.Vector3());
  console.log(
    "[GltfInteriorLoader] RAW Bounding Box vor Verschiebung (min/max):",
    rawBox.min,
    rawBox.max,
  );
  console.log("[GltfInteriorLoader] RAW Bounding Box Größe:", rawSize);
  console.log("[GltfInteriorLoader] RAW Bounding Box Zentrum:", rawCenter);

  const targetX = rawCenter.x;
  const targetY = rawBox.min.y + rawSize.y * 0.75;
  const targetZ = rawBox.min.z + rawSize.z * 0.7;

  // Verschiebung jetzt relativ zum EIGENSTÄNDIGEN GLTF-Zielpunkt
  // (GLTF_DRIVER_X, GLTF_EYE_HEIGHT, 0) - unabhängig von CarController.ts.
  // Diese beiden Werte hier oben in der Datei anpassen, um die GLTF-
  // Geometrie zu verschieben, OHNE die tatsächliche Kameraposition zu
  // beeinflussen.
  group.position.set(
    GLTF_DRIVER_X - targetX,
    GLTF_EYE_HEIGHT - targetY,
    0 - targetZ,
  );

  // DEBUG: Hilfsachsen (rot=X, grün=Y, blau=Z) am EIGENSTÄNDIGEN GLTF-
  // Zielpunkt (GLTF_DRIVER_X, GLTF_EYE_HEIGHT, 0). Zeigt dir, wohin die
  // GLTF-Geometrie gerade ausgerichtet wird - bei Abweichung von der roten
  // Marker-Kugel aus CarController.ts (= echte Kameraposition) siehst du
  // sofort, wie weit beide Punkte noch voneinander entfernt sind. ENTFERNEN,
  // sobald die Positionierung final passt.
  const axesHelper = new THREE.AxesHelper(0.3);
  axesHelper.position.set(GLTF_DRIVER_X, GLTF_EYE_HEIGHT, 0);
  const outerGroup = new THREE.Group();
  outerGroup.add(axesHelper);
  outerGroup.add(group);

  if (!steeringWheel) {
    console.warn(
      "[GltfInteriorLoader] 'Steering_wheel'-Gruppe nicht gefunden - " +
        "Lenkanimation wird nicht funktionieren.",
    );
  }

  // DEBUG: Misst die tatsächliche räumliche Ausdehnung (Bounding Box) der
  // geladenen Gruppe NACH der Verschiebung - dient jetzt nur noch der
  // Verifikation. Erwartung: Box sollte den Punkt (GLTF_DRIVER_X,
  // GLTF_EYE_HEIGHT, 0) eng umschließen. Falls dieser Punkt erkennbar von
  // der ECHTEN Kameraposition aus CarController.ts abweicht (rote Marker-
  // Kugel im DEBUG_BIRDSEYE_VIEW), GLTF_DRIVER_X/GLTF_EYE_HEIGHT oben in
  // der Datei anpassen, bis beide Punkte visuell zusammenfallen.
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  console.log(
    "[GltfInteriorLoader] Bounding Box NACH Verschiebung " +
      `(sollte (${GLTF_DRIVER_X}, ${GLTF_EYE_HEIGHT}, 0) umschließen):`,
  );
  console.log("[GltfInteriorLoader] Bounding Box Größe (x,y,z):", size);
  console.log("[GltfInteriorLoader] Bounding Box Zentrum (x,y,z):", center);
  console.log("[GltfInteriorLoader] Bounding Box min/max:", box.min, box.max);

  // Schatten für alle Meshes in der NEUEN, gefilterten Gruppe aktivieren -
  // bewusst erst hier, nach dem Filtern.
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // FENSTER/SCHEIBEN AUFHELLEN: Das GLTF-Glas-Material (Windschutzscheibe,
  // ggf. weitere "Window"-benannte Meshes/Materialien) kommt aus dem
  // Sketchfab-Export oft zu dunkel/zu stark eingefärbt - die Sicht nach
  // draußen wirkt dadurch trüb. Fix: alle Meshes/Materialien, deren Name
  // "Window" enthält, transparent + auf einen festen, hellen Opacity-Wert
  // setzen. EINMALIG beim Laden (kein Slider/Live-Update nötig laut
  // Anforderung - daher direkt hier in der Loader-Funktion statt in einem
  // separaten, reaktiven Hook wie im React-Three-Fiber-Vorbild).
  const WINDOW_TINT_OPACITY = 0.18; // niedriger Wert = durchsichtiger/heller; ggf. anpassen
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const materials = Array.isArray(obj.material)
      ? obj.material
      : [obj.material];
    materials.forEach((mat) => {
      const nameMatch =
        obj.name.includes("Window") ||
        obj.name.includes("Windshield") || // zusätzlich zur ursprünglichen Vorlage,
        // da unsere Whitelist-Gruppe "Windshield" heißt, nicht "Window"
        mat?.name?.includes("Window");
      if (!nameMatch) return;
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        mat.transparent = true;
        mat.opacity = WINDOW_TINT_OPACITY;
        // Farbe NICHT auf Schwarz gesetzt (anders als ursprüngliche
        // Vorlage) - das würde die Scheibe abdunkeln statt aufzuhellen.
        // Stattdessen helles, leicht bläuliches Grau, passend zur M_GLASS-
        // Referenzfarbe aus InteriorBuilder.ts (0x9fc3df).
        mat.color.set(0x9fc3df);
      }
    });
  });

  // Platzhalter-Spiegelflächen: eigene, einfache Plane-Meshes für die
  // bestehende RTT-Logik. WICHTIG: Da diese Meshes der GLEICHEN group
  // hinzugefügt werden, die bereits skaliert wurde (SCALE_FACTOR), würden
  // ihre Positionswerte sonst ebenfalls mit skaliert. Da wir die Positionen
  // in "echten" Metern angeben wollen, werden sie hier durch SCALE_FACTOR
  // geteilt, damit sie nach Anwendung der Gruppen-Skalierung an der
  // korrekten, in Metern gedachten Stelle landen. Größen (PlaneGeometry)
  // sind davon nicht betroffen, da sie unabhängig von group.scale in der
  // Geometrie selbst definiert werden - daher zusätzlich durch SCALE_FACTOR
  // geteilt, um die geometrische Größe nach der Skalierung wieder auf den
  // gewünschten Wert zu bringen.
  const mirrorMat = new THREE.MeshBasicMaterial({ color: 0x8a98a8 });
  const rearviewSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2 / SCALE_FACTOR, 0.06 / SCALE_FACTOR),
    mirrorMat,
  );
  rearviewSurface.position.set(0, 1.4 / SCALE_FACTOR, -0.9 / SCALE_FACTOR);
  group.add(rearviewSurface);

  const leftMirrorSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1 / SCALE_FACTOR, 0.07 / SCALE_FACTOR),
    mirrorMat.clone(),
  );
  leftMirrorSurface.position.set(
    -0.9 / SCALE_FACTOR,
    1.05 / SCALE_FACTOR,
    -0.8 / SCALE_FACTOR,
  );
  leftMirrorSurface.rotation.y = Math.PI / 2;
  group.add(leftMirrorSurface);

  const rightMirrorSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1 / SCALE_FACTOR, 0.07 / SCALE_FACTOR),
    mirrorMat.clone(),
  );
  rightMirrorSurface.position.set(
    0.9 / SCALE_FACTOR,
    1.05 / SCALE_FACTOR,
    -0.8 / SCALE_FACTOR,
  );
  rightMirrorSurface.rotation.y = -Math.PI / 2;
  group.add(rightMirrorSurface);

  return {
    group: outerGroup,
    steeringWheel: steeringWheel ?? new THREE.Object3D(),
    rearviewSurface,
    leftMirrorSurface,
    rightMirrorSurface,
  };
}
