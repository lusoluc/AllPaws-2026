# AllPaws-2026: Detailed Features & Examples 💡

This document explains exactly how each feature in AllPaws-2026 works and how it helps volunteers in their day-to-day animal rescue operations. It is written using simple language and practical scenarios so that anyone, regardless of technical background, can understand.

---

## 🇬🇧 English: In-Depth Features & Real-Life Sce### 1. Offline-First Data Entry
*   **The Problem**: You are in a cold, metal-shielded quarantine container, or on a remote countryside road where a cat was abandoned. There is absolutely no mobile signal. You want to register the cat immediately before you forget the details, but other apps refuse to load or discard your inputs.
*   **How AllPaws-2026 Solves It**: You open the app on your phone. You can create a new profile, enter their age, medical status, and save draft notes. The app doesn't need a network connection to save this—it writes everything directly into your phone's browser memory (using Dexie & IndexedDB).
*   **Real-Life Example**: *Volunteer Sarah rescues a small black kitten named "Mimi" from an abandoned barn. She has no cellular service. She opens the app, fills out Mimi's profile, takes a photo with her phone camera, and records up to 10 separate voice descriptions. She can also resume/append audio to an existing recording like a dictation tape (sequential client-side audio stitching). She taps "Save". Everything is saved safely on her phone. When she returns to the main office hours later and connects to Wi-Fi, she looks at the dashboard, and Mimi is synced to the database automatically.*

### 2. Digital Adoption Graphic Generator & Share Overlay
*   **The Problem**: Writing social media posts manually is exhausting. You have to copy the cat's details, select a picture, format it, copy the bank IBAN, and post it. This takes 15 minutes per animal. Also, supporters on the public site want to help share cat profiles but don't have access to the dashboard.
*   **How AllPaws-2026 Solves It**: On both the public detail page and the staff edit page, you tap "Social-Media Export" (or click the floating share icon). The app instantly draws a beautiful high-resolution digital adoption graphic on an invisible canvas. It overlays the cat's photo, name, traits, shelter logo, contact emails, and a QR code pointing directly to the cat's profile.
*   **Real-Life Example**: *Sarah wants to post about Mimi on Facebook. Adopters visiting Mimi's profile on the public page also want to help. They click "Grafik erstellen & Profil teilen" at the bottom of Mimi's profile. The app opens a popup displaying a stunning square image containing Mimi's photo with a clean pink border, bulleted traits, shelter contact details, and a QR code. They can download it instantly to post to Instagram or share it directly.*

### 3. Server-Side Newsletter Engine
*   **The Problem**: Sending updates to 500 supporters about adoption success stories or urgent medical appeals takes hours. Copy-pasting addresses in Gmail often results in spam blocks.
*   **How AllPaws-2026 Solves It**: In the helper portal, you go to the "Newsletter" section. You write a single email (e.g., "Mimi has found a warm home!") and tap send. The server processes the queue in the background using Resend, sending individual emails securely and avoiding spam filters.
*   **Real-Life Example**: *The shelter needs €200 for a broken bone operation for a newly rescued cat. The volunteer writes an email, checks the "Urgent Appeal" category, and hits send. The queue manager runs in the background. Within minutes, all 500 subscribers receive a personalized email with the shelter's bank details, resulting in the funds being raised in less than 24 hours.*

### 4. Native Bilingual Multi-Language Support (DE/LT)
*   **The Problem**: Your shelter operates internationally. Supporters in Germany handle adoptions and funding, while local staff in Lithuania handle rescues. Having a website in only one language alienates half of your audience.
*   **How AllPaws-2026 Solves It**: The entire system is built natively with two-language support. With a single toggle button, the user shifts the headers, cat profiles, stories, bank descriptions, and legal notices from German to Lithuanian (and vice versa) instantly.
*   **Real-Life Example**: *Adopter Jonas from Munich opens the shelter page. He clicks "DE" and reads Mimi's biography in perfect German. Meanwhile, volunteer Galina in Lithuania clicks "LT" to read the registration form details and shelter rules in Lithuanian. All data, including custom page blocks, is rendered dynamically in the chosen language.*

### 5. Automated Animal Gallery
*   **The Problem**: Web galleries are tedious to maintain. When a cat gets adopted, you have to log into WordPress, delete the image, re-upload it to a "Happy Ends" page, and update the catalog. If you forget, people keep calling about already adopted cats.
*   **How AllPaws-2026 Solves It**: The public gallery is completely automated and tied directly to the database. Whenever a volunteer updates Mimi's status from "Available" to "Adopted" in the password-protected portal, the gallery updates instantly.
*   **Real-Life Example**: *Mimi is adopted by a family. Sarah logs into the portal and changes Mimi's status to "Adopted". Immediately, Mimi is moved from the public "Available Cats" gallery to the "Success Stories / Happy Ends" list. No manual coding or photo editing required.*

### 6. General Website Customization & CMS (with FAQs)
*   **The Problem**: Animal shelters need general web pages for their history, bank details, contact information, and FAQs (frequently asked questions, e.g. "How does international adoption work?"). Without an IT person, updating these texts requires paying an external web developer.
*   **How AllPaws-2026 Solves It**: A full Content Management System (CMS) is integrated. Volunteers can add "Custom Blocks" (paragraphs, titles, images) and manage a list of FAQs directly in the staff portal. The pages adapt instantly to display these blocks in both German and Lithuanian.
*   **Real-Life Example**: *The shelter changes its bank IBAN. Instead of calling a developer to edit the code, Sarah logs into the portal, enters the new IBAN under "Shelter Settings", and clicks save. The bank details update on the "About Us" page immediately. She also adds a new FAQ item answering "What vaccinations do cats need to travel to Germany?" in both languages, which instantly appears on the public info page.*

### 7. Integrated Donations & Cost Transparency
*   **The Problem**: Supporter engagement is low when they don't know where their money goes. People hesitate to donate when they just see a bank number and a generic "Please Donate" headline.
*   **How AllPaws-2026 Solves It**: The About Us page features a highly prominent donation section containing custom bank wiring info (IBAN, BIC, SWIFT, PayPal) loaded from the centralized config. Alongside it, a clean, transparent cost breakdown explains exactly what specific amounts achieve (e.g. €10 feeds a cat for a week, €25 covers vaccination, €50 sterilizes a cat).
*   **Real-Life Example**: *A supporter named Robert wants to help the shelter. He visits the About Us page and switches it to English. He sees that €25 pays for a vaccine and anti-flea protection, and €100 pays for indoor heating in winter. Feeling connected to the tangible cost, he copies the IBAN directly using a one-tap select action and transfers €50 to spay one cat. He knows exactly how his donation helps.*

### 8. Developer Test Suites (For Technical Volunteers)
To keep the framework stable, AllPaws-2026 features **14 built-in Jest test suites** verifying **90 test points**. When you modify colors, names, or features, you can run tests to verify no bugs were introduced.
*   **How to run tests**:
    ```bash
    pnpm test
    ```
*   **How to run a specific test suite** (e.g. audioStitcher):
    ```bash
    pnpm test audioStitcher
    ```

---

## 🇩🇪 Deutsch: Detailbeschreibung & Praxisbeispiele

### 1. Offline-Erfassung & Multi-Sprachnotizen
*   **Das Problem**: Sie befinden sich in einem isolierten Quarantäne-Container aus Metall oder auf einer abgelegenen Landstraße, auf der eine Katze ausgesetzt wurde. Es gibt absolut kein Handynetz. Sie möchten die Katze sofort registrieren, bevor Details vergessen werden, aber andere Apps brechen ab oder löschen Ihre Eingaben.
*   **Die AllPaws-Lösung**: Sie öffnen die App auf Ihrem Handy. Sie können ein neues Profil anlegen, Alter und Impfstatus eintragen und Notizen speichern. Die App benötigt kein Netz zum Speichern – sie schreibt alles direkt in den internen Speicher Ihres Browsers auf dem Handy (über Dexie & IndexedDB).
*   **Praxisbeispiel**: *Helferin Sarah rettet ein kleines schwarzes Kätzchen namens „Mimi“ aus einer Scheune im Wald. Sie hat keinen Empfang. Sie öffnet die App, füllt Mimis Steckbrief aus, macht ein Foto mit der Handykamera und nimmt bis zu 10 separate Sprachnotizen auf. Sie kann sogar eine bestehende Sprachnotiz fortsetzen (weitere Aufnahmen werden im Browser nahtlos aneinandergeheftet wie bei einem Diktierband). Sie tippt auf „Speichern“. Alles wird sicher auf ihrem Handy gesichert. Als sie Stunden später im Tierheim ankommt und sich das Handy ins WLAN einwählt, synchronisiert sich Mimis Profil vollautomatisch.*

### 2. Social-Media Karten-Generator & Teilen-Overlay
*   **Das Problem**: Beiträge für soziale Medien manuell zu schreiben ist anstrengend. Man muss Katzensteckbriefe abtippen, Bilder zuschneiden, Bankverbindungen kopieren und posten. Das dauert 15 Minuten pro Katze. Auch Besucher auf der öffentlichen Seite möchten beim Teilen helfen, haben aber keinen Zugang zum Dashboard.
*   **Die AllPaws-Lösung**: Auf Mimis öffentlicher Profilseite und auf der Bearbeitungsseite im Portal tippen Sie auf „Grafik erstellen & Profil teilen“. Die App zeichnet im Hintergrund vollautomatisch ein hochauflösendes Bild auf einer virtuellen Leinwand. Es enthält Mimis Foto, ihren Namen, Charaktereigenschaften, das Tierheim-Logo, Kontaktdaten und einen QR-Code, der direkt zu ihrem Profil führt.
*   **Praxisbeispiel**: *Sarah möchte Mimi auf Facebook teilen. Ein interessierter Spender auf der Webseite sieht Mimis Steckbrief und möchte ebenfalls helfen. Er klickt direkt unter Mimis Profil auf „Grafik erstellen & Profil teilen“. Das System öffnet das Teilen-Overlay und generiert die Grafikkarte. Mit einem Klick lädt er sie herunter oder teilt sie auf Instagram.*

### 3. Newsletter-System auf dem Server
*   **Das Problem**: E-Mails an 500 Spender über Vermittlungserfolge oder Notfälle zu senden, dauert Stunden. Beim manuellen Kopieren in Outlook landet man schnell auf Spam-Listen.
*   **Die AllPaws-Lösung**: Im Helfer-Portal gehen Sie auf „Newsletter“. Sie schreiben eine einzige E-Mail (z. B. „Mimi hat ein Körbchen gefunden!“) und klicken auf Senden. Der Server arbeitet die Liste im Hintergrund über den Dienst „Resend“ ab und verschickt die Mails sicher einzeln.
*   **Praxisbeispiel**: *Das Tierheim benötigt dringend 200 € für eine Knochen-OP einer frisch verletzten Katze. Der Helfer schreibt die E-Mail im Newsletter-Bereich und sendet sie ab. Binnen weniger Minuten erhalten alle 500 Abonnenten eine personalisierte Mail mit den Spendendaten – das Geld ist oft in weniger als 24 Stunden gesammelt.*

### 4. Integrierte Zweisprachigkeit (DE/LT)
*   **Das Problem**: Ihr Verein arbeitet grenzüberschreitend. Die Unterstützer in Deutschland kümmern sich um Spenden und Adoptionen, während die Helfer in Litauen die Tiere retten. Eine rein einsprachige Webseite grenzt die Hälfte der Beteiligten aus.
*   **Die AllPaws-Lösung**: Das gesamte Framework ist von Grund auf zweisprachig aufgebaut. Mit einem einzigen Knopf schaltet der Nutzer die gesamte Benutzeroberfläche, Steckbriefe, die Tierheim-Geschichte, Spendendaten und rechtliche Texte sofort zwischen Deutsch und Litauisch um.
*   **Praxisbeispiel**: *Adoptant Jonas aus München klickt auf „DE“ und liest Mimis Biografie auf Deutsch. Gleichzeitig klickt die litauische Leiterin Galina vor Ort auf „LT“, um das Aufnahme-Protokoll auf Litauisch zu sehen. Alle Texte – auch die selbst erstellten CMS-Inhalte – passen sich sofort der gewählten Sprache an.*

### 5. Automatisch generierte Tierheim-Galerie
*   **Das Problem**: Web-Galerien manuell aktuell zu halten ist mühsam. Wird eine Katze vermittelt, muss man sich in WordPress einloggen, das Bild löschen, es auf der „Happy-End“-Seite neu hochladen und den Katalog anpassen. Vergisst man es, fragen Interessenten nach bereits vermittelten Tieren.
*   **Die AllPaws-Lösung**: Die öffentliche Galerie ist vollständig automatisiert und mit der Datenbank gekoppelt. Sobald ein Helfer im passwortgeschützten Portal Mimis Status von „Verfügbar“ auf „Vermittelt“ ändert, aktualisiert sich die Galerie in Sekundenschnelle selbst.
*   **Praxisbeispiel**: *Mimi wird adoptiert. Sarah logs in und ändert Mimis Status. Sofort verschwindet Mimi aus der Vermittlungsgalerie und taucht automatisch in der Kategorie „Erfolgsgeschichten“ auf – ganz ohne Bildbearbeitung oder Programmieraufwand.*

### 6. Eigene CMS-Seiten & FAQs erstellen
*   **Das Problem**: Ein Tierheim braucht Infoseiten für die Geschichte des Vereins, Kontodaten, Ansprechpartner und FAQs („Wie läuft die Adoption ab?“). Ohne IT-Fachkraft im Team muss man für jede Textänderung einen externen Webdesigner bezahlen.
*   **Die AllPaws-Lösung**: Ein vollwertiges Content-Management-System (CMS) ist integriert. Helfer können flexibel Inhaltsblöcke (Absätze, Überschriften, Bilder) hinzufügen und FAQs verwalten. Die Inhalte werden auf den öffentlichen Seiten in beiden Sprachen dynamisch ausgegeben.
*   **Praxisbeispiel**: *Das Tierheim ändert seine Bankverbindung. Sarah loggt sich ein, trägt die neue IBAN in den Einstellungen ein und speichert. Die Kontodaten auf der „Über uns“-Seite aktualisieren sich sofort. Sie fügt außerdem eine neue FAQ hinzu, welche Impfungen für die Reise nach Deutschland nötig sind – diese erscheint sofort für alle Besucher sichtbar.*

### 7. Integrated Donations & Cost Transparency
*   **Das Problem**: Spender sind zurückhaltend, wenn sie nicht wissen, wo ihr Geld landet. Ein bloßer IBAN-Code mit einem unpersönlichen „Bitte spenden“-Satz baut keine Verbindung auf.
*   **Die AllPaws-Lösung**: Die „Über uns“-Seite verfügt über einen übersichtlichen Spendenbereich mit flexibel konfigurierbaren Bankdaten (IBAN, BIC, Verwendungszweck und PayPal-Link) aus der zentralen Konfiguration. Direkt daneben zeigt eine transparente Tabelle, was Spenden konkret bewirken (z. B. 10 € für gesundes Futter, 25 € für die Impfung/Entwurmung, 50 € für Kastration & Heimtierausweis).
*   **Praxisbeispiel**: *Spender Robert möchte helfen. Er öffnet die Spendenrubrik und sieht genau: 10 € ernähren eine Katze für eine Woche. 50 € ermöglichen die Kastration und den Chip für ein neues Patentier. Er kopiert die IBAN bequem per Klick und überweist 50 € mit dem Verwendungszweck „Kastrationshilfe“. Er fühlt sich sicher und weiß genau, was seine Spende bewirkt.*

### 8. Entwickler-Test-Suites (Für IT-Helfer)
AllPaws-2026 enthält **14 Jest-Test-Suites mit 90 Testfällen**, die sicherstellen, dass die App stabil bleibt. Wenn Sie das Design oder Funktionen ändern, können Sie die Tests ausführen, um Fehler sofort aufzudecken.
*   **Tests ausführen**:
    ```bash
    pnpm test
    ```
*   **Einen spezifischen Test ausführen** (z. B. profileShare):
    ```bash
    pnpm test profileShare
    ```

---

## 🇱🇹 Lietuvių: Išsamus funkcijų aprašymas ir pavyzdžiai

### 1. Duomenų suvedimas be interneto & Keli balso įrašai
*   **Problema**: Esate metaliniame karantino konteineryje arba atokiame kaimo kelyje, kur buvo palikta katė. Telefono ryšio visiškai nėra. Norite užregistruoti katę iškart, kol nepamiršote detalių, bet kitos programėlės tiesiog neveikia arba ištrina jūsų suvestą informaciją.
*   **„AllPaws-2026“ sprendimas**: Atsidarote programėlę telefone. Galite sukurti naują katės profilį, įvesti amžių, skiepus ir išsaugoti juodraštį. Programėlei nereikia interneto – ji viską įrašo į telefono naršyklės vidinę atmintį (naudojant Dexie ir IndexedDB).
*   **Tikras pavyzdys**: *Savanorė Rasa miške randa mažą juodą kačiuką vardu „Mimi“. Ryšio nėra. Ji atsidaro programėlę, užpildo Mimi profilį, telefonu nufotografuoja kačiuką ir įrašo iki 10 skirtingų balso pastabų. Ji taip pat gali pratęsti jau esamą garso įrašą (papildomas įrašas fone sujungiamas su esamu lyg magnetinėje juostoje). Paspaudžia „Išsaugoti“. Visi duomenys saugiai lieka jos telefone. Grįžus į prieglaudą ir prisijungus prie „Wi-Fi“, programėlė fone pati išsiunčia Mimi duomenis į debesų bazę.*

### 2. Dalijimosi kortelių generatorius socialiniams tinklams & Bendrinimo langas
*   **Problema**: Rankiniu būdu rašyti skelbimus „Facebook“ yra nuobodu ir užtrunka ilgai. Reikia nukopijuoti katės aprašymą, parinkti nuotrauką, surašyti banko sąskaitos duomenis. Tai užtrunka apie 15 minučių vienam gyvūnui. Be to, svetainės lankytojai taip pat nori dalintis gyvūnų kortelėmis, bet neturi prieigos prie savanorių aplinkos.
*   **„AllPaws-2026“ sprendimas**: Tiek viešame gyvūno profilyje, tiek savanorių valdymo skydo redagavimo puslapyje galite paspausti „Social-Media Export“. Programėlė akimirksniu sukuria gražų, aukštos raiškos paveikslėlį: uždeda nuotrauką, vardą, bruožus, prieglaudos logotipą, kontaktus ir QR kodą, vedantį tiesiai į katės profilį.
*   **Tikras pavyzdys**: *Rasa nori pasidalinti pranešimu apie Mimi „Facebook“. Rėmėjas svetainėje taip pat nori padėti. Jis paspaudžia mygtuką „Grafik erstellen & Profil teilen“ tiesiai po Mimi profiliu. Atidaromas bendrinimo langas su gražiu kvadratiniu paveikslėliu, Mimi bruožais ir QR kodu. Robertas vienu paspaudimu parsisiunčia jį ir pasidalina savo „Instagram“.*

### 3. Naujienlaiškių siuntimo sistema iš serverio
*   **Problema**: Siųsti naujienas ar skubius pagalbos prašymus 500 prieglaudos rėmėjų rankiniu būdu užtrunka labai ilgai, o el. paštas (pvz. Gmail) gali užblokuoti laiškus kaip brukalą (spam).
*   **„AllPaws-2026“ sprendimas**: Savanorių portale atsidarote skiltį „Newsletter“. Parašote vieną laišką (pvz., „Mimi rado naujus namus!“) ir paspaudžiate „Send“. Serveris pats fone po vieną saugiai išsiunčia laiškus visiems gavėjams per „Resend“ sistemą.
*   **Tikras pavyzdys**: *Skubiai reikia 200 € naujai išgelbėtos katės lūžusios kojos operacijai. Savanoris parašo laišką rėmėjams, nurodo temą „Skubus prašymas“ ir išsiunčia. Per kelias minutes visi 500 prenumeratorių gauna asmeninius laiškus su prieglaudos rekvizitais – reikalinga suma dažnai surenkama greičiau nei per parą.*

### 4. Dvi kalbos sistemoje (DE/LT)
*   **Problema**: Prieglauda dirba tarptautiniu mastu. Rėmėjai Vokietijoje koordinuoja įvaikinimą ir paramą, o vietiniai darbuotojai Lietuvoje atlieka gelbėjimo darbus. Puslapis tik viena kalba būtų nepatogus pusei vartotojų.
*   **„AllPaws-2026“ sprendimas**: Sistema sukurta palaikyti dvi kalbas. Vieno mygtuko paspaudimu vartotojas gali pakeisti visus tekstus, kačių profilius, sąskaitų aprašymus ir taisykles iš vokiečių į lietuvių kalbą ir atvirkščiai.
*   **Tikras pavyzdys**: *Būsimas įvaikintojas Jonas iš Miuncheno spaudžia „DE“ ir skaito Mimi aprašymą vokiškai. Tuo tarpu savanorė Galina prieglaudoje spaudžia „LT“, kad matytų registracijos formą lietuviškai. Visi duomenys prisitaiko akimirksniu.*

### 5. Automatinė gyvūnų galerija
*   **Problema**: Rankiniu būdu atnaujinti svetainės galerijas užtrunka. Kai katė suranda namus, savanoris turi prisijungti prie svetainės, ištrinti nuotrauką iš vieno puslapio ir įkelti į kitą. Jei pamirštama, žmonės toliau skambina dėl jau įvaikintų kačių.
*   **„AllPaws-2026“ sprendimas**: Viešoji galerija yra visiškai automatizuota. Kai savanoris apsaugotame portale pakeičia Mimi statusą iš „Ieško namų“ į „Surado namus“, galerija svetainėje atsinaujina pati.
*   **Tikras pavyzdys**: *Mimi suradus namus, Rasa portale pažymi tai sistemoje. Mimi automatiškai dingsta iš viešosios ieškančiųjų galerijos ir atsiranda skiltyje „Sėkmės istorijos“. Rasa sutaupo laiko, kurį gali skirti kitoms katėms.*

### 6. Svetainės turinio valdymas (TVS) ir DUK skiltis
*   **Problema**: Prieglaudai reikia paprastų puslapių apie jos istoriją, rekvizitus bei DUK skiltį (pvz., „Kaip pasiruošti katės atvykimui?“). Neturint programuotojo komandoje, kiekvienam teksto pataisymui tenka samdyti išorinius specialistus.
*   **„AllPaws-2026“ sprendimas**: Integruota paprasta turinio valdymo sistema. Savanoriai gali patys kurti puslapių blokus (pastraipas, antraštes, nuotraukas) ir pildyti DUK klausimus. Pakeitimai iškart matomi svetainėje abiem kalbomis.
*   **Tikras pavyzdys**: *Prieglauda keičia banko sąskaitą. Rasa prisijungia, įveda naują sąskaitą nustatymuose ir išsaugo. Svetainės puslapyje „Apie mus“ informacija atsinaujina iškart. Ji taip pat įveda naują DUK klausimą apie kelionei reikalingus skiepus, kuris akimirksniu atsiranda visiems svetainės lankytojams.*

### 7. Integruotos paramos galimybės ir išlaidų skaidrumas
*   **Problema**: Žmonės nenoriai aukoja, kai mato tik sausus rekvizitus ir užrašą „Prašome paremti“. Jiems trūksta emocinio ryšio ir suvokimo, kur keliauja pinigai.
*   **„AllPaws-2026“ sprendimas**: Puslapyje „Apie mus“ integruota aiški paramos skiltis su banko rekvizitais (Sąskaita, BIC, Mokėjimo paskirtis) ir tiesiogine „PayPal“ nuoroda, gaunama iš konfigūracijos. Šalia pateikiama vaizdi lentelė, parodanti, jak konkreti suma padeda (pvz., 10 € – maistas savaitei, 25 € – skiepai, 50 € – kastracija ir mikročipas).
*   **Tikras pavyzdys**: *Rėmėjas Robertas nori padėti prieglaudai. Jis atsidaro puslapį ir pamato lentelę: 10 € pamaitina vieną katę savaitei, o 100 € apmoka šildymą šaltą žiemą. Matydamas realią naudą, jis vienu paspaudimu nukopijuoja IBAN kodą ir perveda 50 € katės kastracijai. Robertas jaučiasi prisidėjęs prie konkretaus gyvybės gelbėjimo.*

### 8. Programuotojų testavimo sistema (IT savanoriams)
Kad užtikrintų sistemos stabilumą, „AllPaws-2026“ turi **14 integruotų Jest testų rinkinių su 90 unikalių testų**. Jei programuotojas keičia spalvas ar programėlės logiką, jis gali paleisti testus ir iškart pamatyti, ar kas nors nesugedo.
*   **Kaip paleisti testus**:
    ```bash
    pnpm test
    ```
*   **Kaip paleisti konkretų testą** (pvz., audioStitcher):
    ```bash
    pnpm test audioStitcher
    ```� pamaitina vieną katę savaitei, o 100 € apmoka šildymą šaltą žiemą. Matydamas realią naudą, jis vienu paspaudimu nukopijuoja IBAN kodą ir perveda 50 € katės kastracijai. Robertas jaučiasi prisidėjęs prie konkretaus gyvybės gelbėjimo.*

### 8. Programuotojų testavimo sistema (IT savanoriams)
Kad užtikrintų sistemos stabilumą, „AllPaws-2026“ turi **12 integruotų Jest testų rinkinių su 84 unikaliais testais**. Jei programuotojas keičia spalvas ar programėlės logiką, jis gali paleisti testus ir iškart pamatyti, ar kas nors nesugedo.
*   **Kaip paleisti testus**:
    ```bash
    pnpm test
    ```
*   **Kaip paleisti konkretų testą** (pvz., login):
    ```bash
    pnpm test login
    ```
