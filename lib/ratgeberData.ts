import { 
  Smile, 
  Activity, 
  Utensils, 
  Home, 
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export interface GuideItem {
  id: string;
  category: 'behavior' | 'bodyLanguage' | 'nutrition' | 'safety' | 'problems';
  icon: any;
  question: {
    DE: string;
    LT: string;
  };
  answer: {
    DE: string;
    LT: string;
  };
}

export const iconMap: Record<string, any> = {
  Smile,
  Activity,
  Utensils,
  Home,
  AlertTriangle,
  ShieldAlert
};

export const guideItems: GuideItem[] = [
  {
    id: 'behavior-1',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie verhält sich eine Katze in den ersten Tagen im neuen Zuhause?",
      LT: "Kaip katė elgiasi pirmosiomis dienomis naujuose namuose?"
    },
    answer: {
      DE: "Es ist völlig normal, dass sich deine neue Katze anfangs unter dem Sofa, im Schrank oder hinter Vorhängen versteckt. Bedränge sie nicht und ziehe sie nicht gewaltsam heraus. Lass ihr Zeit, stelle Futter, Wasser und das Katzenklo in die Nähe ihres Verstecks und rede leise und beruhigend mit ihr. Sobald die Wohnung ruhig ist (z. B. nachts), wird sie beginnen, ihr neues Revier selbstständig zu erkunden.",
      LT: "Visiškai normalu, kad katė iš pradžių slepiasi po sofa, spintoje ar už užuolaidų. Neverskite jos išeiti ir netempkite jėga. Duokite jai laiko, padėkite maistą, vandenį ir kraiko dėžutę šalia jos slėptuvės, kalbėkite su ja ramiai ir tyliai. Kai namuose bus tylu (pvz., naktį), ji pradės pati tyrinėti savo naują teritoriją."
    }
  },
  {
    id: 'behavior-2',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie gewöhne ich meine Katze an das Katzenklo?",
      LT: "Kaip pripratinti katę prie kraiko dėžutės?"
    },
    answer: {
      DE: "Katzen sind von Natur aus sehr reinliche Tiere. Stelle das Katzenklo an einen ruhigen, ungestörten Ort, der für die Katze jederzeit frei zugänglich ist (nicht direkt neben den Fressplatz!). Setze die Katze nach dem Fressen oder direkt nach dem Schlafen vorsichtig in das Klo. Wenn du siehst, dass sie auf dem Boden scharrt, setze sie ebenfalls hinein. Verwende anfangs die gleiche Streu-Art, die sie aus dem Tierheim gewohnt ist.",
      LT: "Katės iš prigimties yra labai švarūs gyvūnai. Padėkite kraiko dėžutę ramioje, netrukdomoje vietoje, kuri katėms būtų prieinama visada (bet ne šalia maisto dubenėlio!). Švelniai įkelkite katę į dėžutę po valgio arba tik jai pabudus. Jei pastebėsite, kad ji pradeda kasti grindis, taip pat įkelkite ją į kraiką. Iš pradžių naudokite tokį patį kraiko tipą, kokį ji naudojo prieglaudoje."
    }
  },
  {
    id: 'behavior-3',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie führe ich eine neue Katze mit einer vorhandenen Erstkatze zusammen?",
      LT: "Kaip supažindinti naują katę su jau namuose gyvenančia kita kate?"
    },
    answer: {
      DE: "Nutze die Methode der 'langsamen Zusammenführung'. Trenne die Katzen anfangs räumlich. Tausche Decken und Spielzeuge aus, damit sie sich an den Geruch des anderen gewöhnen. Füttere beide Katzen an einer geschlossenen Zimmertür, um positive Assoziationen mit dem Geruch des Partners zu wecken. Verwende später ein Gittertor, bevor sie direkten Kontakt haben.",
      LT: "Naudokite lėto supažindinimo metodą. Iš pradžių atskirkite kates skirtinguose kambariuose. Mainykite jų guolius ir žaislus, kad jos priprastų prie viena kitos kvapo. Maitinkite abi kates prie uždarytų durų, taip sukurdami teigiamą asociaciją su kito kvapu. Vėliau naudokite tinklines duris prieš leisdami tiesioginį kontaktą."
    }
  },
  {
    id: 'behavior-4',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie gewöhne ich eine scheue Katze an die Transportbox?",
      LT: "Kaip pripratinti baimingą katę prie transportavimo dėžutės?"
    },
    answer: {
      DE: "Lass die Transportbox dauerhaft als gemütliche Höhle im Wohnzimmer stehen. Lege eine weiche Decke hinein und füttere die Katze regelmäßig in der Box. So verliert sie die Angst vor der Box. Schließe die Tür anfangs nur für wenige Sekunden und belohne sie sofort danach mit Leckerlis.",
      LT: "Palikite transportavimo dėžutę kambaryje kaip nuolatinį guolį. Įdėkite minkštą antklodę ir reguliariai maitinkite katę dėžutės viduje. Taip ji praras dėžutės baimę. Iš pradžių uždarykite dureles tik kelioms sekundėms ir iškart po to apdovanokite katę skanėstais."
    }
  },
  {
    id: 'behavior-5',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Warum sind Katzen nachts aktiv und wie kann ich das regulieren?",
      LT: "Kodėl katės aktyvios naktį ir kaip tai reguliuoti?"
    },
    answer: {
      DE: "Katzen sind dämmerungsaktive Jäger. Spiele abends vor dem Schlafen intensiv mit der Katze, um sie körperlich auszulasten. Gib ihr direkt danach die größte Mahlzeit des Tages. Das signalisiert ihrem Körper: Jagen, Fressen, Schlafen. Ignoriere nächtliches Miauen oder Kratzen konsequent, um dieses Verhalten nicht zu verstärken.",
      LT: "Katės yra prieblandoje aktyvūs medžiotojai. Prieš miegą intensyviai pažaiskite su kate, kad ji pavargtų. Iškart po to duokite jai didžiausią dienos maisto porciją. Tai siunčia signalą kūnui: medžioti, valgyti, miegoti. Naktinį miaukimą ar draskymą ignoruokite, kad jo nesustiprintumėte."
    }
  },
  {
    id: 'behavior-6',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie lange schlafen Katzen am Tag?",
      LT: "Kiek laiko per parą miega katės?"
    },
    answer: {
      DE: "Katzen schlafen und dösen durchschnittlich 12 bis 16 Stunden am Tag. Das liegt an ihrer Natur als Raubtiere, die bei der Jagd extrem viel Energie verbrauchen. Ältere Katzen und Kitten können sogar bis zu 20 Stunden am Tag schlafen. Stelle ihnen ruhige, erhöhte Schlafplätze zur Verfügung.",
      LT: "Katės vidutiniškai miega ir snūsta nuo 12 iki 16 valandų per parą. Tai lemia jų plėšri prigimtis, reikalaujanti daug energijos medžioklei. Vyresnės katės ir kačiukai gali miegoti net iki 20 valandų per parą. Suteikite joms ramias, aukštas miego vietas."
    }
  },
  {
    id: 'behavior-7',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Sind Katzen Einzelgänger oder brauchen sie Artgenossen?",
      LT: "Ar katės yra vienišės, ar joms reikia draugijos?"
    },
    answer: {
      DE: "Katzen sind keine Einzelgänger, sondern soziale Tiere. Besonders bei reiner Wohnungshaltung ist ein Artgenosse extrem wichtig, um Einsamkeit und Verhaltensproblemen vorzubeugen. Nur Freigänger oder sehr alte, falsch sozialisierte Katzen werden manchmal als Einzelkatzen gehalten.",
      LT: "Katės nėra vienišės, jos yra socialūs gyvūnai. Ypač laikant katę tik bute, kita katė yra labai svarbi, kad būtų išvengta vienatvės ir elgesio problemų. Tik lauke gyvenančios arba labai senos, netinkamai socializuotos katės kartais laikomos vienos."
    }
  },
  {
    id: 'behavior-8',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Warum treteln Katzen auf weichen Decken?",
      LT: "Kodėl katės minko minkštas antklodes (treteliuoja)?"
    },
    answer: {
      DE: "Das Treteln (auch Milchtritt genannt) ist ein Verhalten aus der Kittenzeit. Kačiukai treteliuoja aplink motinos spenelius, um den Milchfluss anzuregen. Bei erwachsenen Katzen ist es ein Zeichen von absolutem Wohlbefinden, Entspannung und Zuneigung gegenüber dem Besitzer oder der Decke.",
      LT: "Minkymas (milchtritt) yra elgsena iš kačiuko laikotarpio. Kačiukai minko aplink motinos spenelius, kad paskatintų pieno tekėjimą. Suaugusioms katėms tai yra visiškos gerovės, atsipalaidavimo ir meilės šeimininkui ar antklodei ženklas."
    }
  },
  {
    id: 'behavior-9',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Warum lieben Katzen Kartons so sehr?",
      LT: "Kodėl katės taip mėgsta kartonines dėžes?"
    },
    answer: {
      DE: "Kartons bieten Katzen Sicherheit und Schutz vor Feinden. Da sie Höhlenbrüter und Lauerjäger sind, lieben sie es, sich zu verstecken und ihre Umgebung unbemerkt zu beobachten. Zudem isoliert Karton hervorragend gegen Kälte und speichert Körperwärme.",
      LT: "Kartoninės dėžės suteikia katėms saugumo jausmą ir apsaugą nuo priešų. Kadangi jos yra urviniai gyvūnai ir tykantys medžiotojai, joms patinka slėptis ir stebėti aplinką. Be to, kartonas puikiai izoliuoja šaltį ir sulaiko kūno šilumą."
    }
  },
  {
    id: 'behavior-10',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Wie gewöhne ich eine Katze an einen Staubsauger?",
      LT: "Kaip pripratinti katę prie dulkių siurblio?"
    },
    answer: {
      DE: "Stelle den Staubsauger ausgeschaltet in den Raum und lege Leckerlis darauf. Bewege ihn erst unbenutzt. Schalte ihn später in einem anderen Raum auf niedrigster Stufe an, während ein Helfer der Katze in sicherer Entfernung ihre Lieblingsleckerlis füttert. Erhöhe die Lautstärke langsam über Wochen.",
      LT: "Palikite išjungtą dulkių siurblį kambaryje ir padėkite ant jo skanėstų. Iš pradžių judinkite jį neįjungtą. Vėliau įjunkite jį kitame kambaryje mažiausiu galingumu, kol kitas žmogus saugiu atstumu maitins katę skanėstais. Lėtai didinkite triukšmą per kelias savaites."
    }
  },
  {
    id: 'behavior-11',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Warum werfen Katzen Gegenstände vom Tisch?",
      LT: "Kodėl katės meta daiktus nuo stalo?"
    },
    answer: {
      DE: "Dies ist eine Kombination aus Jagdtrieb (sie testen, ob sich das 'Beutetier' bewegt) und dem Wunsch nach Aufmerksamkeit. Wenn die Katze merkt, dass der Mensch sofort reagiert (aufsteht, schimpft oder spielt), wiederholt sie das Verhalten, um Langeweile zu vertreiben.",
      LT: "Tai yra medžioklės instinkto (jos tikrina, ar 'grobis' juda) und dėmesio siekimo derinys. Jei katė pastebi, kad žmogus iškart reaguoja (atsistoja, kalbasi ar žaidžia), ji kartos šį elgesį, kad išvengtų nuobodulio."
    }
  },
  {
    id: 'behavior-12',
    category: 'behavior',
    icon: iconMap['Smile'],
    question: {
      DE: "Warum putzen sich Katzen gegenseitig?",
      LT: "Kodėl katės prausia viena kitą?"
    },
    answer: {
      DE: "Das gegenseitige Putzen (Allogrooming) dient der sozialen Bindung und stärkt das Gruppengefühl. Es wird oft an Stellen durchgeführt, die die Katze selbst schwer erreicht (z. B. Kopf und Nacken). Es ist ein Zeichen von Vertrauen und Freundschaft innerhalb einer Katzengruppe.",
      LT: "Abipusis prausimas (allogrooming) stiprina socialinį ryšį ir grupės jausmą. Tai dažnai daroma tose vietose, kurias pačiai katei sunku pasiekti (pvz., galva ir kaklas). Tai yra pasitikėjimo ir draugystės ženklas kačių grupėje."
    }
  },
  {
    id: 'body-1',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Was bedeutet es, wenn meine Katze langsam blinzelt?",
      LT: "Ką reiškia, kai katė lėtai mirksi?"
    },
    answer: {
      DE: "Langsames Blinzeln gilt als das ultimative Zeichen von Vertrauen und Zuneigung bei Katzen – man nennt es auch das „Katzen-Lächeln“ oder den „Katzen-Kuss“. Es signalisiert, dass sich die Katze in deiner Gegenwart vollkommen sicher und entspannt fühlt. Wenn du deine Katze ansiehst, kannst du ihr langsam zurückblinzeln, um ihr auf ihrer eigenen Sprache zu zeigen, dass du ihr freundlich gesinnt bist.",
      LT: "Lėtas mirksėjimas yra didžiausio pasitikėjimo ir meilės ženklas – jis dažnai vadinamas „kačių šypsena“ arba „kačių bučiniu“. Tai rodo, kad katė jūsų draugijoje jaučiasi visiškai saugi ir atsipalaidavusi. Pažvelgę į katę, galite jai lėtai sumirksėti atgal, kad jos pačios kalba parodytumėte, jog esate draugiškas."
    }
  },
  {
    id: 'body-2',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Wie deute ich die Bewegungen des Katzen-Schwanzes?",
      LT: "Kaip suprasti katės uodegos uodegavimą ir judesius?"
    },
    answer: {
      DE: "Ein hoch aufgerichteter Schwanz (oft mit einer kleinen Biegung oder Fragezeichen-Form an der Spitze) signalisiert Freude, Neugier und eine freundliche Begrüßung. Ein leicht zuckendes Schwanzende drückt oft Konzentration oder leichte Aufregung aus. Ein stark peitschender oder hin und her schlagender Schwanz ist jedoch ein deutliches Zeichen für Frustration, Stress oder Aggression – in diesem Fall solltest du der Katze etwas Freiraum geben.",
      LT: "Aukštai iškelta uodega (dažnai su lengvu klaustuko formos linkiu gale) rodo džiaugsmą, smalsumą ir draugišką nusiteikimą. Lengvai virpantis uodegos galiukas reiškia susikaupimą ar lengvą susijaudinimą. Tačiau stipriai plakama ar į šonus judinama uodega yra aiškus nepasitenkinimo, streso ar pykčio ženklas – tokiu atveju geriau palikti katę ramybėje."
    }
  },
  {
    id: 'body-3',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Was bedeutet es, wenn die Katze den Bauch zeigt?",
      LT: "Ką reiškia, kai katė rodo pilvą?"
    },
    answer: {
      DE: "Der Bauch ist die verletzlichste Stelle einer Katze. Wenn sie sich auf den Rücken legt und dir ihren Bauch zeigt, ist das ein großer Vertrauensbeweis. Achtung: Es ist oft keine Einladung zum Streicheln! Viele Katzen reagieren defensiv mit Krallen und Zähnen, wenn man sie am Bauch berührt. Kraule sie lieber am Kopf.",
      LT: "Pilvas yra pažeidžiamiausia katės kūno vieta. Jei ji atsigula ant nugaros ir rodo pilvą, tai rodo didelį pasitikėjimą jumis. Dėmesio: tai dažnai nėra kvietimas glostyti pilvuką! Daugelis kačių ginasi nagais und dantimis, jei liečiate jų pilvą. Geriau paglostykite jai galvą."
    }
  },
  {
    id: 'body-4',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Wie deute ich die Ohrenstellung einer Katze?",
      LT: "Kaip suprasti katės ausų padėtį?"
    },
    answer: {
      DE: "Nach vorne gerichtete Ohren zeigen Neugier und Entspannung. Zur Seite gedrehte Ohren ('Flugzeug-Ohren') signalisieren Skepsis oder leichte Verunsicherung. Flach an den Kopf gepresste Ohren sind ein deutliches Zeichen von Angst, Panik oder Kampfbereitschaft – halte Abstand.",
      LT: "Į priekį nukreiptos ausys rodo smalsumą ir atsipalaidavimą. Į šonus pasuktos ausys ('lėktuvo ausys') signalizuoja apie skeptiškumą ar lengvą sumišimą. Priglaustos prie galvos ausys yra aiškus baimės, panikos ar pasirengimo kovai ženklas – laikykitės atstumo."
    }
  },
  {
    id: 'body-5',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Warum schnurren Katzen und schnurren sie nur bei Wohlbefinden?",
      LT: "Kodėl katės murkia ir ar jos murkia tik jausdamosi gerai?"
    },
    answer: {
      DE: "Katzen schnurren meistens bei Wohlbefinden und Entspannung. Aber sie nutzen das Schnurren auch zur Selbstberuhigung bei großem Stress, Schmerzen, Angst oder sogar beim Sterben. Die Frequenz des Schnurrens (ca. 25-150 Hz) wirkt zudem knochen- und wundheilungsfördernd.",
      LT: "Katės dažniausiai murkia jausdamosi gerai ir atsipalaidavusios. Tačiau jos taip pat murkia norėdamos save nuraminti esant dideliam stresui, skausmui, baimei ar net mirštant. Murkimo dažnis (apie 25-150 Hz) taip pat skatina kaulų ir žaizdų gijimą."
    }
  },
  {
    id: 'body-6',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Was bedeuten weit geöffnete Pupillen bei Katzen?",
      LT: "Ką reiškia stipriai išsiplėtę katės vyzdžiai?"
    },
    answer: {
      DE: "Große, runde Pupillen können durch schlechte Lichtverhältnisse entstehen, drücken aber psychisch oft starke Emotionen aus: Angst, extreme Aufregung, Freude (beim Spielen) oder Stress. Schmale Schlitzpupillen deuten auf Entspannung (bei hellem Licht) oder Aggression/Anspannung hin.",
      LT: "Dideli, apvalūs vyzdžiai gali atsirasti dėl prasto apšvietimo, tačiau emociškai jie dažnai rodo stiprias emocijas: baimę, didelį susijaudinimą, džiaugsmą (žaidžiant) ar stresą. Siauri, plyšio formos vyzdžiai rodo atsipalaidavimą arba agresiją."
    }
  },
  {
    id: 'body-7',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Warum leckt mich meine Katze ab?",
      LT: "Kodėl katė mane laižo?"
    },
    answer: {
      DE: "Das Ablecken (Pflegen) des Menschen ist ein Liebesbeweis und Zeichen der Zugehörigkeit zum selben Rudel. Es ahmt das soziale Putzen unter Katzen nach. Manchmal lecken sie uns auch ab, weil unsere Haut salzig schmeckt (durch Schweiß) oder sie uns mit ihrem Geruch markieren wollen.",
      LT: "Žmogaus laižymas yra meilės įrodymas ir ženklas, kad priklausote tai pačiai 'gaujai'. Tai imituoja socialinį prausimąsi tarp kačių. Kartais jos laižo mus ir todėl, kad mūsų oda yra sūri (nuo prakaito) arba norėdamos pažymėti mus savo kvapu."
    }
  },
  {
    id: 'body-8',
    category: 'bodyLanguage',
    icon: iconMap['Activity'],
    question: {
      DE: "Was bedeutet es, wenn die Katze den Kopf an mir reibt?",
      LT: "Ką reiškia, kai katė trinasi galva į mane?"
    },
    answer: {
      DE: "Dieses Verhalten nennt man 'Bunteln' oder 'Köpfchengeben'. An den Wangen und Schläfen der Katze sitzen Duftdrüsen, die Pheromone abgeben. Durch das Reiben markiert dich die Katze als sicheren, vertrauten Bereich und zeigt dir gleichzeitig ihre tiefe Zuneigung.",
      LT: "Šis elgesys rodo gilų pasitikėjimą ir meilę. Katės skruostuose ir smilkiniuose yra kvapų liaukos, kurios išskiria feromonus. Trindamasi katė pažymi jus kaip saugią, pažįstamą teritoriją ir kartu rodo savo prisirišimą."
    }
  },
  {
    id: 'nutrition-1',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Nassfutter oder Trockenfutter: Was ist gesünder für Wohnungskatzen?",
      LT: "Šlapias ar sausas maistas: kas sveikiau kambarinėms katėms?"
    },
    answer: {
      DE: "Nassfutter sollte immer die Hauptnahrungsquelle sein. Katzen stammen von Wüstentieren ab und trinken von Natur aus sehr wenig; sie decken ihren Flüssigkeitsbedarf fast ausschließlich über die Nahrung. Reines Trockenfutter kann langfristig zu Nierenproblemen und Harnsteinen führen. Achte beim Kauf auf einen Fleischanteil von mindestens 70 % und darauf, dass das Futter getreide- und zuckerfrei ist.",
      LT: "Šlapias maistas visada turėtų būti pagrindinis mitybos šaltinis. Katės kilusios iš dykumų gyvūnų, todėl geria labai mažai; joms reikalingus skysčius jos įsisavina con maistu. Tik sausas maistas ilgainiui gali sukelti inkstų problemų ir šlapimo takų akmenligę. Rinkdamiesi maistą, ieškokite tokio, kuriame mėsos kiekis būtų bent 70 %, ir jame nebūtų grūdų bei cukraus."
    }
  },
  {
    id: 'nutrition-2',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Wie motiviere ich meine Katze, mehr Wasser zu trinken?",
      LT: "Kaip paskatinti katę gerti daugiau vandens?"
    },
    answer: {
      DE: "Stelle die Wassernäpfe niemals direkt neben den Futternapf oder das Katzenklo – in der Natur meiden Katzen stehendes Wasser nahe Beuteresten, da es verunreinigt sein könnte. Verteile stattdessen mehrere Wasserschalen in der Wohnung. Ein absoluter Geheimtipp ist ein Katzen-Trinkbrunnen: Fließendes, plätscherndes Wasser animiert Katzen spielerisch zum Trinken und beugt Nierenerkrankungen vor.",
      LT: "Niekada nedėkite vandens dubenėlių šalia maisto dubenėlio ar kraiko dėžutės – gamtoje katės vengia stovinčio vandens šalia grobio likučių, nes jis gali būti užterštas. Išdėliokite kelis dubenėlius su vandeniu skirtingose buto vietose. Ypač naudingas yra kačių fontanėlis: tekantis ir čiurlenantis vanduo žaismingai skatina katę gerti ir padeda išvengti inkstų ligų."
    }
  },
  {
    id: 'nutrition-3',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Warum dürfen Katzen keine Kuhmilch trinken?",
      LT: "Kodėl katėms negalima duoti karvės pieno?"
    },
    answer: {
      DE: "Die meisten erwachsenen Katzen entwickeln nach der Entwöhnung von der Muttermilch eine Laktoseintoleranz. Ihnen fehlt das Enzym Laktase, um den Milchzucker abzubauen. Der Verzehr von Kuhmilch führt bei ihnen zu schmerzhaften Blähungen, Bauchschmerzen und schwerem Durchfall.",
      LT: "Dauguma suaugusių kačių netoleruoja laktozės. Jos neturi fermento laktazės, reikalingo pieno cukrui suskaidyti. Karvės pieno vartojimas joms sukelia skausmingą pilvo pūtimą, dieglius ir stiprų viduriavimą."
    }
  },
  {
    id: 'nutrition-4',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Welches Fleisch dürfen Katzen nicht fressen?",
      LT: "Kokios mėsos katėms negalima duoti žalios?"
    },
    answer: {
      DE: "Katzen dürfen niemals rohes Schweinefleisch (auch kein Wildschwein) fressen. Es kann das Aujeszky-Virus übertragen, welches für Katzen absolut tödlich ist und die Pseudowut auslöst. Rohes Geflügel birgt zudem das Risiko einer Salmonellen-Infektion.",
      LT: "Katėms niekada negalima duoti žalios kiaulienos (taip pat ir šernienos). Ji gali pernešti Aujeszky virusą, kuris katėms yra mirtinas ir sukelia pasiutligės požymius. Žalia paukštiena taip pat kelia salmoneliozės riziką."
    }
  },
  {
    id: 'nutrition-5',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Wie oft sollte eine Wohnungskatze geimpft werden?",
      LT: "Kaip dažnai reikia skiepyti kambarinę katę?"
    },
    answer: {
      DE: "Wohnungskatzen sollten eine Grundimmunisierung im Kittenalter erhalten. Danach ist ein Schutz gegen Katzenschnupfen und Katzenseuche wichtig. Dieser wird meist alle 1 bis 3 Jahre aufgefrischt. Besprich den genauen Impfplan individuell mit deinem Tierarzt.",
      LT: "Kambarinės katės turi gauti pirminius skiepus kačiuko amžiuje. Vėliau svarbi apsauga nuo kačių maro ir kačių slogos. Šie skiepai dažniausiai kartojami kas 1-3 metus. Aptarkite tikslų skiepų planą su savo veterinarijos gydytoju."
    }
  },
  {
    id: 'nutrition-6',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Woran erkenne ich, dass meine Katze Schmerzen hat?",
      LT: "Kaip suprasti, kad katei kažką skauda?"
    },
    answer: {
      DE: "Katzen verbergen Schmerzen instinktiv. Achte auf subtile Verhaltensänderungen: Rückzug und vermehrtes Verstecken, Futterverweigerung, verändertes Schlafverhalten, Fauchen bei Berührung, eine gekrümmte Körperhaltung oder mangelnde Fellpflege (struppiges Fell).",
      LT: "Katės instinktyviai slepia skausmą. Stebėkite elgesio pokyčius: tūnojimą kampuose, maisto atsisakymą, pakitusį miegą, šnypštimą palietus, susikūprinusią kūno padėtį ar apleistą kailio priežiūrą (susivėlusį kailį)."
    }
  },
  {
    id: 'nutrition-7',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Warum fressen Katzen Gras?",
      LT: "Kodėl katės ėda žolę?"
    },
    answer: {
      DE: "Katzen fressen Gras (insb. Katzengras), um unverdauliche Haare, die sie bei der täglichen Fellpflege verschlucken, leichter hochwürgen zu können. Die Faserstoffe im Gras helfen zudem, Haarballen im Magen-Darm-Trakt zu binden und den Stuhlgang zu regulieren.",
      LT: "Katės ėda žolę, kad lengviau išvemtų nesuvirškintus plaukus (haarballen), kuriuos praryja prausdamiesi. Žolėje esančios skaidulos taip pat padeda suvirškinti plaukus skrandyje ir reguliuoja žarnyno veiklą."
    }
  },
  {
    id: 'nutrition-8',
    category: 'nutrition',
    icon: iconMap['Utensils'],
    question: {
      DE: "Wie erkenne ich Übergewicht bei Katzen?",
      LT: "Kaip atpažinti katės antsvorį?"
    },
    answer: {
      DE: "Bei einer normalgewichtigen Katze sollten die Rippen beim Streicheln leicht fühlbar (aber nicht sichtbar) sein und eine deutliche Taille von oben erkennbar sein. Hängt der Bauch stark durch und sind keine Rippen mehr tastbar, leidet die Katze an Übergewicht.",
      LT: "Sveiko svorio katės šonkauliai turėtų būti lengvai apčiuopiami (bet nematomi), o iš viršaus turėtų aiškiai matytis juosmuo. Jei pilvas stipriai nukaręs, o šonkaulių apčiuopti neįmanoma, katė turi antsvorio."
    }
  },
  {
    id: 'safety-1',
    category: 'safety',
    icon: iconMap['ShieldAlert'],
    question: {
      DE: "Was ist die Gefahr bei gekippten Fenstern (Kippfenster-Syndrom)?",
      LT: "Kuo pavojingi praviri (atversti) langai ir kas yra Kippfenster sindromas?"
    },
    answer: {
      DE: "⚠️ Gekippte Fenster sind eine lebensgefährliche Falle für Wohnungskatzen. Versucht die Katze, durch den schmalen Spalt nach draußen zu klettern, rutscht sie ab und rutscht tief in den V-förmigen Spalt. Dabei klemmt sie sich Nerven und Blutgefäße ab (Kippfenster-Syndrom), was zu schwersten inneren Verletzungen, Lähmungen oder dem Tod führt. Sichere gekippte Fenster immer mit speziellen Schutzgittern oder halte sie in Abwesenheit der Katze strikt geschlossen.",
      LT: "⚠️ Atversti (palikti vėdinimui) langai yra mirtinas pavojus kambarinėms katėms. Bandydama išlįsti į lauką pro viršų, katė nuslysta žemyn į V formos tarpą. Dėl to užspaudžiami nervai ir kraujagyslės (vadinama Kippfenster sindromu), o tai sukelia sunkius vidaus organų pažeidimus, paralyžių ar net mirtį. Visada naudokite specialias langų apsaugas arba laikykite juos uždarytus, kai katė yra šalia."
    }
  },
  {
    id: 'safety-2',
    category: 'safety',
    icon: iconMap['ShieldAlert'],
    question: {
      DE: "Sind Zimmerpflanzen gefährlich für meine Katze?",
      LT: "Ar kambariniai augalai pavojingi katėms?"
    },
    answer: {
      DE: "Ja, sehr viele beliebte Zimmerpflanzen sind hochgiftig für Katzen. Dazu gehören unter anderem Lilien (schon kleinste Mengen Blütenstaub können tödliches Nierenversagen verursachen), Efeu, Monstera, Orchideen, Alpenveilchen, Tulpen und Weihnachtssterne. Stelle sicher, dass du nur katzenfreundliche Pflanzen (wie Grünlilie, Kentiapflanze oder Geldbaum) hältst und biete deiner Katze immer frisches Katzengras als Knabber-Alternative an.",
      LT: "Taip, labai daug populiarių kambarinių augalų yra labai nuodingi katėms. Tarp jų yra lelijos (net mažiausias žiedadulkių kiekis gali sukelti mirtiną inkstų nepakankamumą), gebenės, monstera, orchidėjos, tulpės ir puansetijos. Įsitikinkite, kad namuose auginate tik katėms saugius augalus (pvz., chlorofitą ar kietį) ir visada pasiūlykite katei šviežios kačių žolės."
    }
  },
  {
    id: 'safety-3',
    category: 'safety',
    icon: iconMap['Home'],
    question: {
      DE: "Wie gestalte ich eine Stadtwohnung artgerecht für eine Katze?",
      LT: "Kaip pritaikyti miesto butą katei, kad ji jaustųsi gerai?"
    },
    answer: {
      DE: "Nutze die Vertikale! Katzen leben dreidimensional. Richte ihnen Klettermöglichkeiten, erhöhte Aussichtsplattformen und Liegeplätze auf Schränken oder Regalen ein. Ein deckenhoher Kratzbaum ist Pflicht. Stelle mindestens zwei Katzenklos auf (Formel: Anzahl der Katzen + 1). Ein mit einem stabilen Katzennetz gesicherter Balkon bietet frische Luft, Gerüche und visuelle Stimulation, was Langeweile vorbeugt.",
      LT: "Išnaudokite vertikalią erdvę! Katės mėgsta aukštas vietas stebėti savo teritorijai. Įrenkite lentynas, draskykles ir vietas prie lango. Apsaugotas balkonas (tinklas) suteikia gryno oro, naujų kvapų ir vizualinės veiklos, o tai saugo nuo nuobodulio."
    }
  },
  {
    id: 'safety-4',
    category: 'safety',
    icon: iconMap['Home'],
    question: {
      DE: "Warum ist die Waschmaschine eine Gefahrenquelle?",
      LT: "Kuo pavojinga skalbimo mašina katėms?"
    },
    answer: {
      DE: "Katzen lieben warme, dunkle Verstecke. Eine offen stehende Waschmaschine oder ein Wäschetrockner zieht sie magisch an, besonders wenn bereits weiche Wäsche darin liegt. Schließe die Türen dieser Geräte immer sofort und kontrolliere die Trommel gründlich vor jedem Waschgang.",
      LT: "Katės mėgsta šiltas, tamsias slėptuves. Atidaryta skalbimo mašina ar džiovyklė jas traukia, ypač jei viduje jau yra minkštų drabužių. Visada uždarykite šių prietaisų dureles ir prieš kiekvieną skalbimą kruopščiai patikrinkite būgną."
    }
  },
  {
    id: 'safety-5',
    category: 'safety',
    icon: iconMap['Home'],
    question: {
      DE: "Wie sichere ich einen Balkon katzengerecht?",
      LT: "Kaip saugiai pritaikyti balkoną katėms?"
    },
    answer: {
      DE: "Ein Balkon sollte immer mit einem speziellen, bissfesten Katzennetz gesichert werden. Dieses sollte bis zur Decke oder als geschlossener Käfig gespannt sein. Verwende Netze mit Drahtverstärkung, damit die Katze das Netz nicht durchbeißen kann. Lass sie nie unbeaufsichtigt auf dem Balkon.",
      LT: "Balkonas visada turėtų būti apsaugotas specialiu, draskymui ir kandimui atspariu kačių tinklu. Jis turėtų būti įtemptas iki pat viršaus. Naudokite tinklus su vielos pastiprinimu, kad katė negalėtų jo pragraužti. Nepalikite katės balkone be priežiūros."
    }
  },
  {
    id: 'safety-6',
    category: 'safety',
    icon: iconMap['Home'],
    question: {
      DE: "Warum sind Plastiktüten und Wollfäden gefährlich?",
      LT: "Kuo pavojingi plastikiniai maišeliai ir siūlai?"
    },
    answer: {
      DE: "In Plastiktüten kann die Katze ersticken oder sich in den Henkeln verfangen und in Panik geraten. Wollfäden, Geschenkband oder Nähgarn können beim Verschlucken zu lebensgefährlichen Darmverschlingungen führen (sog. linearer Fremdkörper). Räume diese Dinge immer sicher weg.",
      LT: "Plastikiniuose maišeliuose katė gali uždusti arba įsipainioti į rankenas ir panikuoti. Siūlai, dovanų juostelės ar siuvimo siūlai praryti gali sukelti mirtiną žarnyno nepraeinamumą (linijinį svetimkūnį). Visada paslėpkite šiuos daiktus."
    }
  },
  {
    id: 'safety-7',
    category: 'safety',
    icon: iconMap['Home'],
    question: {
      DE: "Darf meine Katze Speisereste vom Tisch fressen?",
      LT: "Ar galima katėms duoti maisto likučius nuo stalo?"
    },
    answer: {
      DE: "Nein, gewürzte Speisen sind für Katzen ungeeignet und oft giftig. Zwiebeln, Knoblauch, Schnittlauch, Schokolade (Theobromin), Weintrauben, Rosinen und Avocados sind hochgiftig für Katzen. Salz und Gewürze schädigen die Nieren und den Magen-Darm-Trakt schwer.",
      LT: "Ne, prieskoniais pagardintas žmonių maistas netinka katėms ir dažnai yra nuodingas. Svogūnai, česnakai, šokoladas, vynuogės, razinos ir avokadai yra labai nuodingi katėms. Druska ir prieskoniai stipriai pažeidžia inkstus ir skrandį."
    }
  },
  {
    id: 'problems-1',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Was tun, wenn die Katze unrein ist und in Ecken uriniert?",
      LT: "Ką daryti, jei katė šlapinasi ne vietose?"
    },
    answer: {
      DE: "Uriniert eine Katze plötzlich außerhalb der Toilette, ist das ein Hilferuf. Lass dies zuerst tierärztlich abklären, da oft Harnwegsinfekte, Blasenentzündungen oder Nierensteine die Ursache sind. Liegen keine organischen Gründe vor, ist es meist Stress oder Unzufriedenheit: z. B. ein falscher Standort der Toilette (zu unruhig), ein neues Familienmitglied, ungeeignetes Katzenstreu oder zu seltene Reinigung. Bestrafe die Katze niemals – das verschlimmert den Stress nur! Reinige die Stellen gründlich mit enzymatischem Reiniger (kein Ammoniak!) und stelle zusätzliche Klos auf.",
      LT: "Jei katė staiga pradeda šlapintis ne vietoje, tai yra pagalbos šauksmas. Pirmiausia kreipkitės į veterinarą, nes tai dažnai būna šlapimo takų uždegimo ar inkstų akmenligės požymis. Jei ligų nėra, priežastis dažniausiai yra stresas arba nepasitenkinimas: bloga kraiko dėžutės vieta (per daug triukšminga), pasikeitusi aplinka, netinkamas kraikas ar per retai valoma dėžutė. Niekada nebauskite katės! Išvalykite vietą fermentiniu valikliu (nenaudokite chloro ar amoniako) ir padėkite papildomų dėžučių."
    }
  },
  {
    id: 'problems-2',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Was kann ich tun, wenn sich meine Katze nicht streicheln lässt?",
      LT: "Ką daryti, jei katė nesileidžia glostoma?"
    },
    answer: {
      DE: "Gerade Katzen aus dem Tierheim tragen oft Ängste oder Traumata in sich. Zwinge die Katze niemals zu Kontakt und halte sie nicht fest, wenn sie weglaufen will. Setze dich ruhig auf den Boden in ihre Nähe, lies ein Buch oder arbeite am Laptop und ignoriere sie – das nimmt ihr den Druck. Biete ihr deine Hand zum Schnuppern an, wenn sie von sich aus näher kommt. Streichle sie anfangs nur sanft an den Wangen oder am Kinn. Lerne ihre Körpersprache: Ein zuckender Schwanz oder angelegte Ohren bedeuten „Stopp, mir reicht es!“. Respektiere diese Grenzen bedingungslos.",
      LT: "Katės iš prieglaudos dažnai turi baimių ar praeities traumų. Niekada neverskite katės bendrauti ir nelaikykite jos jėga. Atsisėskite ramiai ant grindų šalia jos, užsiimkite savo reikalais (pvz., skaitykite knygą) ir nekreipkite į ją dėmesio – tai sumažins spaudimą. Kai ji pati priartės, pasiūlykite ranką uostymui. Glostykite švelniai tik skruostus ar smakrą. Stebėkite kūno kalbą: uodegos judėjimas ar priglaustos ausys reiškia „gana!“. Visada gerbkite šias ribas."
    }
  },
  {
    id: 'problems-3',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Warum kratzt meine Katze an Möbeln oder Tapeten und wie gewöhne ich es ihr ab?",
      LT: "Kodėl katė drasko baldus ir kaip ją atpratinti?"
    },
    answer: {
      DE: "Kratzen ist ein natürliches Bedürfnis zur Krallenpflege und Reviermarkierung. Wenn deine Katze Möbel zerkratzt, fehlen ihr oft attraktive Alternativen. Platziere stabile Kratzbäume oder Kratzpappen direkt neben den Stellen, die sie gerne zerkratzt. Reinige die zerkratzten Möbel gründlich mit Essigwasser oder Enzymreiniger, um Markiergerüche zu entfernen. Belobe die Katze ausgiebig mit Leckerlis, sobald sie die neuen Kratzmöglichkeiten nutzt.",
      LT: "Draskymas yra natūralus instinktas nagams galąsti ir teritorijai žymėti. Jei katė drasko baldus, jai greičiausiai trūksta tinkamų draskyklių. Pastatykite stabilias draskykles tiesiai prie tų vietų, kurias ji mėgsta draskyti. Kruopščiai nuvalykite baldus, kad pašalintumėte kvapą, ir gausiai apdovanokite katę skanėstais, kai ji naudoja draskyklę."
    }
  },
  {
    id: 'problems-4',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Warum miaut meine Katze nachts lautstark?",
      LT: "Kodėl mano katė garsiai miaukia naktimis?"
    },
    answer: {
      DE: "Nächtliches Miauen kann Langeweile, Hunger oder Einsamkeit bedeuten. Bei älteren Katzen ab ca. 12 Jahren kann es auch ein Zeichen von Demenz oder Bluthochdruck sein. Beschäftige die Katze tagsüber mehr und füttere sie spät am Abend. Lass organische Ursachen vom Tierarzt abklären.",
      LT: "Naktinis miaukimas gali reikšti nuobodulį, alkį ar vienatvę. Vyresnėms katėms (nuo 12 metų) tai gali būti demencijos ar padidėjusio kraujospūdžio požymis. Daugiau užimkite katę dieną ir maitinkite vėlai vakare. Patikrinkite sveikatą pas veterinarą."
    }
  },
  {
    id: 'problems-5',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Warum beißt mich meine Katze plötzlich beim Spielen?",
      LT: "Kodėl katė staiga įkanda man žaidžiant?"
    },
    answer: {
      DE: "Das Beißen beim Spielen geschieht oft aus Überstimulation. Wenn die Katze zu aufgeregt ist, schlägt ihr Spieltrieb in Jagdverhalten um. Beende das Spiel sofort, wenn sie grob wird, und sag laut 'Nein'. Benutze nie deine Hände als Spielzeug, sondern Angeln oder Bälle.",
      LT: "Kandimas žaidžiant dažnai įvyksta dėl per didelio susijaudinimo. Kai žaidimas tampa per intensyvus, katės instinktai persijungia į medžioklę. Nedelsiant nutraukite žaidimą, jei ji elgiasi grubiai. Niekada nenaudokite rankų kaip žaislo, žaiskite su meškerėmis ar kamuoliukais."
    }
  },
  {
    id: 'problems-6',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Was kann ich tun, wenn meine Katze Angst vor Besuchern hat?",
      LT: "Ką daryti, jei katė bijo svečių?"
    },
    answer: {
      DE: "Zwinge die Katze niemals, herauszukommen. Erkläre Besuchern, die Katze komplett zu ignorieren. Stelle der Katze sichere Rückzugsorte im Raum bereit (z. B. auf einem Schrank). Wenn sie von alleine kommt, darf der Besuch ihr vorsichtig ein Leckerli zuwerfen, ohne sie anzusehen.",
      LT: "Niekada neverskite katės išeiti pas svečius. Paprašykite svečių visiškai ignoruoti katę. Suteikite katei saugių vietų aukštai (pvz., ant spintos). Jei ji pati prieina, svečias gali atsargiai numesti jai skanėstą, nežiūrėdamas į ją tiesiai."
    }
  },
  {
    id: 'problems-7',
    category: 'problems',
    icon: iconMap['AlertTriangle'],
    question: {
      DE: "Warum kratzt meine Katze an der Schlafzimmertür?",
      LT: "Kodėl katė drasko miegamojo duris?"
    },
    answer: {
      DE: "Katzen hassen geschlossene Türen, da sie ihr Revier kontrollieren wollen. Wenn du die Tür schließt, fühlt sie sich ausgeschlossen. Ignoriere das Kratzen und Miauen konsequent. Jede Reaktion (auch Schimpfen) belohnt sie mit Aufmerksamkeit. Biete ihr alternative Schlafplätze an.",
      LT: "Katės nemėgsta uždarytų durų, nes jos nori kontroliuoti savo teritoriją. Jei uždarote duris, ji jaučiasi atskirta. Visiškai ignoruokite durų draskymą. Bet kokia jūsų reakcija (net ir barimas) jai yra dėmesys. Pasiūlykite patrauklių miego vietų kitur."
    }
  },
];
