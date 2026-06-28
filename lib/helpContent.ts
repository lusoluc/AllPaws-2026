export interface HelpEntry {
  title: string;
  body: string;
}

export const helpContent: Record<string, HelpEntry> = {
  name: {
    title: 'Name des Tiers',
    body: 'Jedes Tier benötigt einen Namen, damit wir es im System und auf der Webseite wiederfinden. \n\n💡 **Tipp gegen Fehler:** Wenn wir mehrere Katzen mit demselben Namen haben (z.B. zwei Lunas), schreibe bitte eine Zahl oder Beschreibung dazu, z.B. "Luna 2" oder "Luna (schwarz)", damit es nicht zu Verwechslungen bei Impfungen oder Fütterungen kommt!'
  },
  roomCage: {
    title: 'Raum & Käfig / Box',
    body: 'Trage hier ein, wo das Tier gerade untergebracht ist (z.B. "Container 1" oder "Box B3"). Das hilft allen Kollegen bei der täglichen Arbeit.\n\n⚠️ **Wichtig:** Bitte aktualisiere diese Angabe immer sofort, wenn eine Katze umzieht, damit Medikamente und Futter immer an der richtigen Stelle ankommen!'
  },
  gender: {
    title: 'Geschlecht',
    body: 'Wähle aus, ob das Tier weiblich oder männlich ist. Das ist besonders für Adoptanten und für die medizinische Planung (z.B. Kastration) wichtig.'
  },
  age: {
    title: 'Alter angeben',
    body: 'Du hast drei Möglichkeiten, das Alter einzutragen:\n\n1. **Alter (von - bis):** Wenn du das Alter nur schätzen kannst (z.B. "ca. 2-3 Jahre"). Das ist der Standard für Fundtiere.\n2. **Alter (exakt):** Wenn das Alter genau bekannt ist.\n3. **Geburtsjahr:** Wenn das Geburtsjahr bekannt ist, errechnet die App das Alter automatisch für dich. Optional kannst du auch Monat und Tag eintragen.\n\n🔍 **Wie schätzen?** Schau auf die Zähne: Sind sie sehr weiß und sauber, ist das Tier meist jung (<1 Jahr). Haben sie viel Zahnstein oder fehlen Zähne, ist das Tier meist älter.'
  },
  arrivalDate: {
    title: 'Seit wann im Tierheim?',
    body: 'Wähle das Jahr und den Monat aus, in dem die Katze bei uns aufgenommen wurde. Das ist wichtig für unsere Statistiken und hilft uns zu sehen, welche Tiere schon sehr lange auf ein Zuhause warten.'
  },
  reason: {
    title: 'Geschichte / Abgabegrund',
    body: 'Schreibe hier kurz auf, wie das Tier zu uns kam (z.B. "Als Fundkatze auf der Straße gefunden" oder "Wegen Allergie des Besitzers abgegeben").\n\n❤️ **Für die Adoptanten:** Schreibe ehrlich und einfühlsam. Geschichten bewegen Menschen dazu, ein Tier aufzunehmen. Vermeide aber allzu grausamen Details, um Leser nicht zu verschrecken.'
  },
  restrictions: {
    title: 'Einschränkungen & Krankheiten',
    body: 'Trage hier Krankheiten, Allergien, benötigte Medikamente oder Spezialfutter ein (z.B. "Braucht Nierendiät-Futter" oder "Medikament für Herz jeden Morgen").\n\n🚨 **Fehler verhindern:** Wenn eine Katze Spezialfutter braucht, trage das bitte zwingend hier ein! Eine falsche Fütterung kann bei chronisch kranken Katzen lebensgefährlich sein. Wenn alles okay ist, schreibe einfach "Keine bekannt".'
  },
  misc: {
    title: 'Sonstige Notizen',
    body: 'Hier kannst du alle Informationen eintragen, die in keine andere Kategorie passen (z.B. Vorlieben der Katze, wie "spielt gerne mit Bällen" oder "mag kein Trockenfutter").'
  },
  publish: {
    title: 'Galerie veröffentlichen',
    body: 'Wenn dieses Häkchen gesetzt ist, wird das Tier auf unserer öffentlichen Webseite für alle Besucher angezeigt, sobald das Handy online ist.\n\n🔒 **Entwurf behalten:** Wenn du das Häkchen wegnimmst, bleibt das Tier als Entwurf gespeichert. Nur Tierheim-Mitarbeiter können es dann im Dashboard sehen. Perfekt, wenn du das Profil später in Ruhe fertigstellen willst.'
  },
  emergency: {
    title: 'Sorgenfell / SOS-Notfall',
    body: 'Setze dieses Häkchen nur bei Tieren, die ganz dringend ein neues Zuhause brauchen (z.B. weil sie im Tierheim extrem trauern, sehr alt sind oder eine Behinderung haben).\n\n🌟 **Was passiert dann?** Die Katze wird auf der Webseite ganz oben mit einem auffälligen roten SOS-Banner angezeigt, damit Besucher sie zuerst sehen.'
  },
  medical: {
    title: 'Medizinischer Status',
    body: 'Aktiviere die Knöpfe, um den Gesundheitsstatus des Tiers zu dokumentieren:\n\n- **Kastriert:** Das Tier wurde operiert, um Nachwuchs zu verhindern.\n- **Gechipt:** Das Tier trägt einen Mikrochip zur Identifikation.\n- **Impfungen (Tollwut / Katzenschnupfen):** Dokumentiere den aktuellen Impfschutz.\n- **Entwurmt:** Das Tier hat eine Wurmkur erhalten.\n- **EU-Heimtierausweis:** Das ist der blaue Pass, der für Reisen nach Deutschland zwingend erforderlich ist. Der normale gelbe Impfpass reicht für Ausreisen nicht aus!'
  },
  behavior: {
    title: 'Temperament & Verträglichkeit',
    body: 'Wähle für jede Eigenschaft aus, ob sie zutrifft (Ja), nicht zutrifft (Nein) oder ob wir es noch nicht wissen (Unbekannt).\n\n⚠️ **Fehler verhindern:** Wenn eine Katze noch nie mit Hunden oder Kindern zusammen war, wähle bitte unbedingt **"Unbekannt"**! Ein falsches "Ja" kann dazu führen, dass das Tier in eine Familie vermittelt wird, in der es zu gefährlichen Konflikten kommt. Ehrlichkeit schützt die Tiere und die Adoptanten!'
  },
  media: {
    title: 'Fotos & Videos hochladen',
    body: 'Bilder und Videos sind der wichtigste Schlüssel zur Vermittlung!\n\n📸 **Galeriefotos (max. 20):** Fotografiere das Tier am besten auf Augenhöhe bei gutem Licht. Die App verkleinert die Bilder automatisch, damit sie auch bei schlechtem Internet hochgeladen werden können.\n\n📄 **Pässe & Dokumente:** Fotografiere hier die Seiten des Impfpasses oder Verträge ab. Diese Bilder sind nur intern im Mitarbeiterbereich sichtbar.\n\n🎥 **Videos (max. 5):** Videos dürfen maximal 5 Minuten lang und 200 MB groß sein. Direkt in der App aufgenommene Videos werden optimal komprimiert. Größere Videos aus der Galerie werden im Hintergrund automatisch verkleinert, um Datenvolumen zu sparen.\n\n🎙️ **Sprachnotiz:** Perfekt, um im Gehege schnell eine Beschreibung einzusprechen, anstatt auf der Tastatur tippen zu müssen!'
  }
};
