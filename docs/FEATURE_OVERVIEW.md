# AllPaws-2026: Feature Overview 🐾

This document lists the main capabilities of the AllPaws-2026 framework. For detailed descriptions and step-by-step real-world examples, please consult the [Detailed Features & Examples Document](file:///c:/Users/Admin/Documents/AllPaws-2026/docs/DETAILED_FEATURES.md).

---

## 🇬🇧 English: Quick Feature List

AllPaws-2026 is equipped with features built specifically to make shelter work simple, fast, and secure:

1.  **Mobile App Feel (Progressive Web App - PWA)**
    Install it on any smartphone (Android or iPhone) directly from the browser. It places an icon on your home screen, launches full-screen, and runs without loading delays.
2.  **Offline Database (Dexie/IndexedDB)**
    Works completely offline. New animal profiles, pictures, and notes are saved directly onto your device's local memory.
3.  **Background Cloud Sync (Supabase Integration)**
    When you reconnect to Wi-Fi, the app automatically uploads your offline profiles to your central database, resolving conflicts gracefully.
4.  **Local Photo & Audio Storage (OPFS & Blobs)**
    Saves high-quality smartphone pictures and voice memos directly in browser storage so no files are lost during offline sessions.
5.  **Digital Adoption Card Generator**
    Generates a beautiful image of the cat's profile containing a QR code, name, and medical details, ready to share on Facebook, Instagram, or print out for shelter cages.
6.  **Staff & Developer Portal**
    A password-protected portal where helpers manage data, view system debug logs, write newsletters, and manage configurations.
7.  **Server-Side Newsletter Engine**
    Connects to Resend or your own SMTP email server to send animal updates to subscribers.
8.  **Native Multi-Language Support (Bilingual DE/LT)**
    Instantly toggles the entire user interface, animal profiles, history, and custom pages between German and Lithuanian.
9.  **Automated Animal Rescue Gallery**
    Automatically generates a public, beautiful gallery of all cats marked as available for adoption, including advanced filters (age, status, traits).
10. **General Website Customization (CMS & FAQs)**
    Allows non-technical volunteers to create general pages, update the shelter history, change bank information, and maintain FAQ sections directly from the portal without touching code.
11. **Integrated Donations & Cost Transparency**
    Provides simple, prominent donation options (customizable Bank IBAN/BIC transfers and PayPal) alongside an emotional cost breakdown table to show supporters exactly how their donations help.

---

## 🇩🇪 Deutsch: Funktionsübersicht

AllPaws-2026 wurde speziell dafür entwickelt, die tägliche Arbeit im Tierheim einfacher, schneller und sicherer zu machen:

1.  **Gefühl wie eine echte Handy-App (Progressive Web App - PWA)**
    Lässt sich direkt aus dem Browser auf jedem Smartphone (Android oder iPhone) installieren. Es erstellt ein Symbol auf dem Startbildschirm und startet ohne Ladeverzögerungen im Vollbildmodus.
2.  **Offline-Datenbank (Dexie/IndexedDB)**
    Funktioniert komplett ohne Internet. Neue Tierprofile, Fotos und Notizen werden sicher auf dem lokalen Speicher Ihres Geräts gesichert.
3.  **Hintergrund-Synchronisation (Supabase-Anbindung)**
    Sobald wieder eine WLAN-Verbindung besteht, lädt die App alle lokal gespeicherten Profile automatisch in die zentrale Cloud-Datenbank und löst Konflikte eigenständig.
4.  **Lokaler Foto- & Audio-Speicher (OPFS & Blobs)**
    Speichert Smartphone-Fotos und Sprachnotizen direkt im Browser-Speicher ab, damit während der Offline-Arbeit nichts verloren geht.
5.  **Karten-Generator für soziale Medien**
    Erstellt auf Knopfdruck ein schönes Bild des Katzenprofils mit einem QR-Code, Namen und Gesundheitsdaten – ideal zum Teilen auf Facebook/Instagram oder zum Ausdrucken für den Katzenkäfig.
6.  **Helfer- & Entwickler-Portal**
    Ein passwortgeschützter Bereich, in dem Helfer Daten verwalten, Systemprotokolle einsehen, Newsletter schreiben und Einstellungen bearbeiten können.
7.  **Newsletter-System auf dem Server**
    Ermöglicht den Versand von E-Mail-Newslettern an Tierfreunde über Resend oder eigene SMTP-Server.
8.  **Integrierte Mehrsprachigkeit (Zweisprachig DE/LT)**
    Schaltet die gesamte Benutzeroberfläche, Tiersteckbriefe, Vermittlungsdaten und individuelle CMS-Inhalte per Mausklick zwischen Deutsch und Litauisch um.
9.  **Automatisch generierte Tierheim-Galerie**
    Erstellt vollautomatisch eine wunderschöne öffentliche Galerie aller zur Vermittlung stehenden Katzen, inklusive Filtermöglichkeiten nach Alter, Charakter und Status.
10. **Homepage-Verwaltung (CMS & FAQs)**
    Ermöglicht es Helfern ohne IT-Kenntnisse, allgemeine Infoseiten zu erstellen, Texte zur Tierheim-Geschichte zu bearbeiten, Kontodaten zu verwalten und FAQs zu pflegen.
11. **Integrierte Spendenmöglichkeiten & Kostentransparenz**
    Bietet direkte, prominente Spendenoptionen (anpassbare Bankdaten für IBAN/BIC-Überweisungen sowie PayPal) gepaart mit einer emotionalen Aufschlüsselungstabelle, die Unterstützern genau zeigt, was ihre Spende bewirkt.

---

## 🇱🇹 Lietuvių: Programėlės funkcijų sąrašas

„AllPaws-2026“ sukurta siekiant palengvinti, pagreitinti ir apsaugoti kasdienį prieglaudos darbą:

1.  **Telefoninės programėlės jausmas (PWA)**
    Galima įdiegti į bet kurį išmanųjį telefoną („Android“ ar „iPhone“) tiesiai iš naršyklės. Sukuriama piktograma ekrane, o programėlė veikia be jokių krovimosi delsų.
2.  **Duomenų bazė be interneto (Dexie/IndexedDB)**
    Veikia visiškai neprisijungus prie tinklo. Nauji profiliai, nuotraukos ir pastabos saugiai įrašomos į įrenginio vidinę atmintį.
3.  **Foninis debesies sinchronizavimas („Supabase“ integracija)**
    Kai telefonas vėl prisijungia prie interneto, programėlė automatiškai fone įkelia visus duomenis į jūsų centrinį debesį ir išsprendžia konfliktus.
4.  **Nuotraukų ir garso įrašų saugykla (OPFS ir Blobs)**
    Išsaugo telefono kameros nuotraukas bei balso įrašus naršyklės atmintyje, kad niekas nepasimestų dirbant be interneto.
5.  **Dalijimosi kortelių generatorius**
    Vienu mygtuko paspaudimu sugeneruoja gražų katės profilio paveikslėlį su QR kodu, vardu ir sveikatos būkle – idealu dalintis „Facebook“, „Instagram“ ar atspausdinti ant narvo.
6.  **Savanorių ir programuotojų portalas**
    Slaptažodžiu apsaugota aplinka, skirta savanoriams tvarkyti duomenis, skaityti sistemos žurnalus, kurti naujienlaiškius ir keisti nustatymus.
7.  **Naujienlaiškių siuntimo sistema**
    Leidžia siųsti el. laiškus ir naujienlaiškius prieglaudos rėmėjams per „Resend“ arba savo SMTP serverį.
8.  **Daugiakalbystės palaikymas (Dvi kalbos: DE/LT)**
    Vieno mygtuko paspaudimu iškart perjungia visą vartotojo sąsają, kačių profilius, istoriją bei turinį tarp vokiečių ir lietuvių kalbų.
9.  **Automatinė gyvūnų galerija**
    Automatiškai sugeneruoja viešą, gražią visų prieglaudos kačių galeriją su paieška ir filtrais pagal amžių, charakterį bei statusą.
10. **Svetainės turinio valdymas (TVS ir DUK)**
    Leidžia savanoriams be programavimo žinių kurti bendruosius puslapius, redaguoti prieglaudos istoriją, keisti banko sąskaitas bei pildyti dažniausiai užduodamų klausimų (DUK) skiltį.
11. **Integruotos paramos galimybės ir skaidrumas**
    Pateikia aiškius paramos būdus (keičiamus banko sąskaitos rekvizitus, BIC kodą, PayPal nuorodas) kartu su emociniu išlaidų paaiškinimu, kad rėmėjai tiksliai matytų, kaip jų pinigai padeda gyvūnams.
