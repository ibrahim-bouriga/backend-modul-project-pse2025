# Architekturentscheidungen für Webshop
**Author:** Mariam Azouka
## ADR-001: PostgreSQL als primäre Datenbank

**Beschreibung:** Verwendung von PostgreSQL als relationale Hauptdatenbank für alle persistenten Daten

**Kontext:** Der Webshop benötigt eine zuverlässige Datenpersistenz für Produkte, Varianten, Bestellungen und Warenkörbe. Die Daten sind stark relational (Produkt → Variante → CartItem → OrderItem) und erfordern ACID-Transaktionen beim Checkout.

**Stakeholder:** Entwicklungsteam, Projektbetreuer

**Owner:** Backend-Entwicklerin (Mariam)

**Rationale:** Relationale Struktur passt optimal zu den Datenanforderungen. PostgreSQL unterstützt zusätzlich JSONB für flexible Produktattribute, sodass kein separates Document-DB-System nötig ist. ACID-Transaktionen sind für den Checkout-Prozess (Stock-Dekrementierung + Order-Erstellung) zwingend erforderlich.

**Constraints:** Horizontale Skalierung eingeschränkt im Vergleich zu NoSQL-Lösungen. Schema-Änderungen erfordern Migrationen.

**Annahmen:** Datenmenge und Zugriffslast bleiben im Rahmen einer einzelnen PostgreSQL-Instanz. Kein horizontales Scaling erforderlich.

**Bezug zu Anforderungen:** Datenpersistenz, Atomare Transaktionen

**Auswirkung:** Alle Geschäftsdaten (Application Data laut Vorlesung) liegen in einer einzigen, konsistenten Datenbank. Prisma 7 wird als ORM eingesetzt mit explizitem Output-Pfad und PrismaPg-Adapter.

---

## ADR-002: Redis als Cache für Session Data

**Beschreibung:** Verwendung von Redis als In-Memory-Cache für Warenkorb-Daten nach dem Cache-Aside-Pattern

**Kontext:** Der Warenkorb wird bei jedem Seitenaufruf geladen und enthält verschachtelte JOINs (cart → items → variant → product). Ohne Cache würde jeder Request eine teure DB-Abfrage auslösen.

**Stakeholder:** Entwicklungsteam, Endnutzer

**Owner:** Backend-Entwicklerin (Mariam)

**Rationale:** Der Warenkorb ist klassische Session Data (temporär, keine finale Geschäftsrelevanz) – laut Vorlesung ist Cache as a Service der optimale Speicherort dafür. Redis speichert Daten In-Memory, was deutlich schneller ist als PostgreSQL-Disk-Zugriff. Cache-Aside-Pattern hält PostgreSQL als Source of Truth.

**Constraints:** Redis-Ausfall darf den Service nicht blockieren. Datenverlust bei Redis-Neustart ist akzeptabel, da PostgreSQL die Source of Truth bleibt.

**Annahmen:** Cart-Daten ändern sich häufig, werden aber noch häufiger gelesen. TTL von 5 Minuten ist ausreichend für typisches Nutzerverhalten.

**Bezug zu Anforderungen:** Performance, Verfügbarkeit, CAP-Theorem

**Auswirkung:** `GET /api/cart` beantwortet Cache-Hits ohne DB-Zugriff. Alle schreibenden Operationen invalidieren den Cache via `safeRedisDel()`. Bei Redis-Ausfall automatischer Fallback auf PostgreSQL (A+P nach CAP-Theorem).

---

## ADR-003: Anonyme Session über HttpOnly-Cookie

**Beschreibung:** Nutzer-Identifikation über anonyme UUID-Session-Cookies statt Login/Authentifizierung

**Kontext:** Der Webshop ist Teil einer größeren Microservice-Plattform. Ein eigenes Auth-System würde den Scope des Webshop-Service sprengen, zumal es nur ein Prototyp sein soll. Dennoch muss der Warenkorb einem Nutzer zugeordnet werden.

**Stakeholder:** Entwicklungsteam, Endnutzer

**Owner:** Backend-Entwicklerin (Mariam)

**Rationale:** UUID v4 als Session-ID ist ausreichend einmalig für anonyme Sessions. HttpOnly verhindert JavaScript-Zugriff auf das Cookie (XSS-Schutz). Der Cookie wird serverseitig in der Session-Middleware gesetzt, nicht vom Frontend.

**Constraints:** Kein plattformübergreifendes Session-Sharing mit anderen Microservices. Session geht verloren wenn Cookie gelöscht wird.

**Annahmen:** Kein Login-System im Scope dieses Services. Warenkorb-Verlust beim Cookie-Löschen ist akzeptabel.

**Bezug zu Anforderungen:** Sicherheit, Warenkorb-Persistenz

**Auswirkung:** Session-Middleware läuft bei jedem Request als erstes. Cart-Entität in PostgreSQL wird erstellt – erst beim ersten Hinzufügen eines Artikels, nicht beim ersten Seitenaufruf.

---

## ADR-004: Prisma 7 als ORM mit PrismaPg-Adapter

**Beschreibung:** Verwendung von Prisma 7 als ORM mit explizitem PrismaPg-Adapter statt eingebautem Connection-String

**Kontext:** Prisma 7: die Datenbankverbindung wird nicht mehr im Schema definiert, sondern in einer separaten `prisma.config.ts`.

**Stakeholder:** Entwicklungsteam

**Owner:** Backend-Entwicklerin (Mariam)

**Rationale:** Prisma bietet typsicheren DB-Zugriff, automatische Relation-Auflösung und einfache Schema-Definition. Der PrismaPg-Adapter ist in Prisma 7 der empfohlene Weg für PostgreSQL-Verbindungen. Expliziter Output-Pfad (`src/generated/prisma`) vermeidet Konflikte mit `node_modules`.

**Constraints:** Prisma 7 ist relativ neu, Dokumentation und Community-Ressourcen sind noch begrenzt.

**Annahmen:** Schema bleibt über die Projektlaufzeit stabil genug für `db push` statt `migrate`.

**Bezug zu Anforderungen:** Datenpersistenz, Entwicklerproduktivität

**Auswirkung:** Typsicherheit bei allen DB-Abfragen zur Compile-Zeit. Seed-Script und Dev-Server laufen über `tsx`. Migrationen werden durch `db push --force-reset` ersetzt (akzeptabel für Entwicklungsumgebung).

---

## ADR-005: Variantenbasiertes Produktmodell

**Beschreibung:** Trennung von Product und ProductVariant als separate Entitäten mit eigenem Stock und Price

**Kontext:** Produkte wie T-Shirts existieren in mehreren Ausprägungen (Größe, Farbe) mit unterschiedlichem Lagerbestand und optionalem Preisaufschlag. Ein flaches Produktmodell könnte diese Komplexität nicht abbilden.

**Stakeholder:** Entwicklungsteam, Shop-Betreiber

**Owner:** Backend-Entwicklerin (Mariam)

**Rationale:** Jede kaufbare Einheit (z. B. T-Shirt Größe M, Farbe Schwarz) hat einen eigenen Stock-Wert. CartItem und OrderItem referenzieren die Variante, nicht das abstrakte Produkt – damit ist immer klar, welche konkrete Ausprägung bestellt wurde. JSONB für `options`-Feld erlaubt flexible Variantenattribute ohne Schema-Änderung.

**Constraints:** Frontend muss Variantenauswahl implementieren und die korrekte `variantId` an die API übergeben.

**Annahmen:** Alle Produkte haben mindestens eine Variante (Single-Varianten für Produkte ohne Auswahl). Stock wird ausschließlich auf Variantenebene verwaltet.

**Bezug zu Anforderungen:** Produktvarianten, Lagerverwaltung

**Auswirkung:** Checkout-Transaktion dekrementiert Stock auf Variantenebene. OrderItem friert Preis (`basePrice + priceDelta`) zum Bestellzeitpunkt ein. Rückwirkende Preisänderungen beeinflussen keine historischen Bestellungen.

---

## ADR-006: Next.js App Router – Server/Client Component Trennung

**Beschreibung:** Strikte Trennung zwischen Server Components (Datenabruf) und Client Components (Interaktivität) nach dem Next.js App Router Modell

**Kontext:** Das Frontend benötigt sowohl serverseitiges Rendering für SEO und Performance als auch clientseitige Interaktivität für Warenkorb, Filterung und Variantenauswahl. Eine rein clientseitige SPA würde unnötig JavaScript zum Browser schicken; ein rein serverseitiger Ansatz könnte keine React-State-basierten Interaktionen abbilden.

**Stakeholder:** Entwicklungsteam, Endnutzer

**Owner:** Frontend-Entwicklerin (Mariam)

**Rationale:** Server Components (`Page`, `Product/[slug]Page`) führen Datenbankabfragen direkt serverseitig. Client Components (`CartProvider`, `CartButton`, `CartDrawer`, `AddToCartForm`, `FilterBar`) erhalten `"use client"` nur dort, wo React State oder Browser-APIs zwingend erforderlich sind. Diese Trennung minimiert das JavaScript-Bundle und maximiert die initiale Ladezeit.

**Constraints:** Client Components können keine Server Components direkt importieren.

**Annahmen:** Interaktive Elemente erfordern ausschließlich bereits vorhandene Daten, die als Props übergeben werden.

**Bezug zu Anforderungen:** Performance, SEO, Interaktivität

**Auswirkung:** `Page` und `Product/[slug]/Page` sind async Server Components und rendern HTML direkt auf dem Server. `"use client"` erscheint ausschließlich in Komponenten, die `useState`, `useEffect`, `useContext` oder Browser-Events benötigen. Server Components übergeben Daten als Props an Client Components (z. B. `variants` an `AddToCartForm`).

---

## ADR-007: Dreistufige Fetch-Caching-Strategie für Produktdaten

**Beschreibung:** Einsatz von drei verschiedenen Caching-Modi je nach Datenmutabilität: `force-cache` für statische Listen, `no-store` für gefilterte Ergebnisse, ISR (`revalidate: 60`) für Produktdetailseiten

**Kontext:** Produktdaten ändern sich selten (Shop-Betrieb), Filterparameter hingegen erzeugen dynamische Kombinationen. Produktdetailseiten haben mittlere Änderungsfrequenz (Preise, Lagerstand). Ohne differenzierte Caching-Strategie würden entweder alle Requests die Datenbank belasten oder veraltete Daten ausgeliefert werden.

**Stakeholder:** Entwicklungsteam, Endnutzer, Shop-Betreiber

**Owner:** Frontend-Entwicklerin (Mariam)

**Rationale:** `force-cache` für die ungefilterte Produktliste nutzt den Next.js Data Cache maximal: der erste Request wird gecacht, alle weiteren werden ohne Backend-Anfrage beantwortet. `no-store` für gefilterte Requests verhindert, dass eine Kategorie-Anfrage die Cache-Einträge einer anderen überschreibt. ISR mit `revalidate: 60` für Detailseiten balanciert Aktualität (Lagerstand) und Performance: die Seite wird statisch ausgeliefert, im Hintergrund aber spätestens alle 60 Sekunden neu generiert.

**Constraints:** `force-cache` setzt voraus, dass die API-URL als stabiler Cache-Key mit den Query-Parametern übereinstimmt. ISR ist kein Echtzeit-Lagerstatus. Abweichungen von bis zu 60 Sekunden sind akzeptabel.

**Annahmen:** Produktkatalog und Kategorien ändern sich nicht innerhalb einer normalen Nutzersitzung. Ein Lagerstand-Fehler beim Checkout wird serverseitig abgefangen (Stock-Check in Transaktion), veraltete Frontend-Anzeige ist tolerierbar.

**Bezug zu Anforderungen:** Performance, Datenkonsistenz, Verfügbarkeit

**Auswirkung:** `getProducts()` prüft mit `hasFilters` dynamisch, welchen Cache-Modus er verwendet. `getCategories()` nutzt stets `force-cache`. `getProduct(slug)` nutzt `next: { revalidate: 60 }`. Stale-While-Revalidate-Verhalten bei ISR: Nutzer bekommen immer sofort eine Antwort, auch wenn die Seite im Hintergrund neu gebaut wird.

---

## ADR-009: URL-Parameter als persistenter Filter- und Sortier-State

**Beschreibung:** Kategorie-Filter und Sortierung werden ausschließlich als URL Query-Parameter (`?category=shirts&sort=price_asc`) gespeichert, nicht als React-komponenteninterner State

**Kontext:** Die FilterBar muss Filterauswahlen an die Server Component `Page` kommunizieren. Server Components können keinen clientseitigen State lesen – sie lesen ausschließlich `searchParams`. Eine rein clientseitige Filterlösung würde das Server-Side-Rendering der Produktliste umgehen und SEO sowie initiale Ladeperformance verschlechtern.

**Stakeholder:** Entwicklungsteam, Endnutzer

**Owner:** Frontend-Entwicklerin (Mariam)

**Rationale:** URL als State-Container ermöglicht drei Vorteile gleichzeitig: (1) Filteransichten sind über Links teilbar und bookmarkbar, (2) der Browser-Zurück-Button navigiert durch Filterzustände, (3) die Server Component liest `searchParams` direkt und führt den gefilterten Datenbankaufruf serverseitig aus.

**Constraints:** Filterstatus geht beim Browser-Hard-Refresh nicht verloren (im Gegensatz zu `useState`), ist aber auch nicht sessionübergreifend persistent. Jede Filteränderung erzeugt einen neuen Navigationseintrag im Browser-History-Stack.

**Annahmen:** Die Menge der Filterkombinationen ist überschaubar. Filterparameter sind nicht sicherheitssensitiv – sie werden serverseitig als reine Query-Parameter an die Produkt-API weitergereicht, nicht als SQL-Parameter.

**Bezug zu Anforderungen:** UX, SEO, Server-Side Rendering

**Auswirkung:** FilterBar verwendet `useRouter`, `usePathname` und `useSearchParams` aus `next/navigation`. Die aktive Kategorie (`activeCategory`) und Sortierung (`activeSort`) werden als Props von der Server Component übergeben, nicht aus eigenem State gelesen.