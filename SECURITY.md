# Security & Maintenance Guide (GDPR & Zero-Ops)

Dieses Dokument erklärt die Sicherheitsarchitektur, Datenschutz-Richtlinien (DSGVO) und den Wartungsaufwand von **AllPaws 2026 / Būk mano draugas** für Vereine und IT-Verantwortliche.

---

## 1. Wartungsaufwand: Die "Zero-Ops"-Architektur

Tierschutzvereine haben in der Regel keine eigene IT-Abteilung und kein Budget für Server-Administratoren. Die App wurde daher nach dem **Zero-Ops-Prinzip** entworfen:

| Komponente | Wartungsaufwand | Kosten | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Frontend (PWA)** | **Null** | 0 € | Die App besteht aus statischen HTML-, JS- und CSS-Dateien. Sie kann kostenlos auf GitHub Pages, Vercel, Netlify oder jedem einfachen Webspace gehostet werden. Keine Server-Software (wie Node.js, PHP) muss dauerhaft gewartet oder aktualisiert werden. |
| **Lokale Datenbank** | **Null** | 0 € | Die Datenbank (Dexie IndexedDB) läuft komplett im Browser des Endgeräts. Keine Datenbank-Server, keine Backups auf Server-Ebene notwendig. |
| **Cloud-Synchronisation** | **Minimal** | 0 € (Free Tier) | Das optionale Backend nutzt **Supabase** (ein managed Firebase-Klon auf PostgreSQL-Basis). Supabase übernimmt Upgrades, Sicherheits-Patches, physische Backups und die Server-Verfügbarkeit vollautomatisch. |

### Wer wartet das System nach dem Setup?
* **Updates**: Neue Versionen der PWA werden über den Service Worker automatisch im Hintergrund auf die Geräte der Helfer geladen. Sobald der Entwickler eine neue statische Version hochlädt (z. B. per Git Push auf GitHub), aktualisieren sich die Endgeräte beim nächsten Online-Kontakt selbst.
* **Server-Abstürze**: Da es keinen eigenen Server gibt, der abstürzen kann, ist die App extrem ausfallsicher. Selbst wenn Supabase kurzzeitig offline ist, arbeiten die Helfer im Tierheim unterbrechungsfrei offline in ihrer lokalen IndexedDB weiter.

---

## 2. Datensicherheit & Privatsphäre (DSGVO-Konformität)

Adoptionsanfragen und interne Notizen zu Tieren enthalten hochsensible persönliche Daten (Namen, Telefonnummern, Wohnverhältnisse der Bewerber). Im Vergleich zu US-SaaS-Plattformen bietet AllPaws folgende Datenschutzvorteile:

### A. Lokale Datenhoheit (Local-First Sandbox)
* Alle erfassten Daten werden primär lokal in der **IndexedDB des Webbrowsers** gespeichert.
* Browser-Sicherheitsarchitektur: Der Browser isoliert diese Daten über die **Same-Origin-Policy (SOP)**. Andere Webseiten können niemals auf die IndexedDB von AllPaws zugreifen.
* Bei einem reinen Offline-Betrieb verlassen die Daten niemals das Gerät des Helfers.

### B. DSGVO-konformes Hosting mit Supabase (EU-Regionen)
Wenn die Cloud-Synchronisation aktiviert ist, fließen die Daten in eine Supabase-Datenbank.
* **Standort-Wahl**: Vereine können beim Erstellen ihres Supabase-Projekts die **Region "EU (Frankfurt)"** wählen. Dadurch werden alle Daten, Tierprofile und Backups ausschließlich auf Servern innerhalb der EU gespeichert.
* **Keine US-SaaS-Tracker**: Es gibt keine Drittanbieter-Tracker (wie Google Analytics, Mixpanel, Hotjar) in der App. Das Nutzerverhalten wird nicht analysiert, was die Anforderungen für Cookie-Banner und Datenschutzerklärungen minimiert.

### C. Newsletter-System ohne Fremdanbieter
Viele Vereine nutzen Mailchimp, was aufgrund des Datentransfers in die USA datenschutzrechtlich problematisch ist.
* **AllPaws-Lösung**: Die Newsletter-Abonnenten werden direkt in der eigenen Vereinsdatenbank gespeichert. 
* **Double-Opt-In & Opt-Out**: Ein Double-Opt-In-Prozess und automatische Abmeldelinks sind integriert und werden direkt über das eigene Mail-Relay des Vereins abgewickelt.

### D. Passwort-Schutz & Verschlüsselung
* Der Zugang zum Mitarbeiter-Dashboard ist passwortgeschützt. Passwörter werden im Client-Code ausschließlich als kryptografische **SHA-256 Hashes** hinterlegt. Bei einer Kompromittierung des JavaScript-Bundles können Angreifer das Klartext-Passwort nicht auslesen.
* Alle Übertragungen zur Cloud erfolgen verschlüsselt über **HTTPS** (TLS 1.3).
