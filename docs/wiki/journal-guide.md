# Guida alla Struttura del Journal dell'Avventura

Questa guida ti insegna come organizzare il Journal dell'avventura per ottenere suggerimenti AI di alta qualità e rilevamento preciso delle deviazioni dalla trama.

## Perché la Struttura del Journal è Importante

Il Journal dell'avventura è il **cervello contestuale** di Narrator Master. L'AI analizza il contenuto del Journal per:

- **Generare suggerimenti pertinenti** basati sulla situazione attuale
- **Rilevare quando i giocatori si allontanano** dalla trama prevista
- **Proporre ponti narrativi** per riportare i giocatori sulla storia
- **Fornire riferimenti rapidi** a PNG, luoghi ed eventi

> **Principio chiave**: Un Journal ben strutturato = suggerimenti AI più utili e precisi.

### Vantaggi di una Buona Struttura

| Vantaggio | Descrizione |
|-----------|-------------|
| **Suggerimenti accurati** | L'AI comprende meglio il contesto e propone consigli pertinenti |
| **Rilevamento preciso** | Identifica con maggiore accuratezza le deviazioni dalla trama |
| **Riferimenti rapidi** | Trova velocemente informazioni su PNG, luoghi ed eventi |
| **Risparmio token** | Contenuto organizzato = meno token API = costi ridotti |

## Struttura Consigliata

### Organizzazione in Pagine

Dividi il Journal in pagine logiche e chiaramente etichettate:

```
📖 Journal: Avventura "Il Mistero della Torre"
  📄 Panoramica dell'Avventura
  📄 Atto 1: Arrivo al Villaggio
  📄 Atto 2: Indagini alla Torre
  📄 Atto 3: Il Confronto Finale
  📄 PNG Principali
  📄 Luoghi Importanti
  📄 Oggetti e Indizi
  📄 Segreti e Rivelazioni
```

### Pagina: Panoramica dell'Avventura

La prima pagina dovrebbe fornire una visione d'insieme dell'avventura.

**Esempio di contenuto**:

```markdown
# Il Mistero della Torre

## Trama Principale
I personaggi sono convocati nel piccolo villaggio di Vallegrigia dal borgomastro Aldric.
Una misteriosa torre è apparsa durante la notte nella foresta vicina. Strani fenomeni
affliggono il villaggio: bambini che parlano lingue antiche, animali che si comportano
stranamente, e sogni condivisi da tutti gli abitanti.

## Obiettivo Finale
Esplorare la torre, scoprire che è un'antica prigione dimensionale, e decidere se
liberare o imprigionare nuovamente l'entità antica intrappolata al suo interno.

## Tema Centrale
Scelte morali ambigue: l'entità è veramente malvagia o è stata ingiustamente imprigionata?

## Durata Prevista
3-4 sessioni (12-16 ore di gioco)

## Livello Consigliato
Personaggi di livello 5-7
```

### Pagina: Atto per Atto

Ogni atto principale dovrebbe avere una pagina dedicata con obiettivi chiari e eventi chiave.

**Esempio - Atto 1: Arrivo al Villaggio**:

```markdown
# Atto 1: Arrivo al Villaggio

## Obiettivi dell'Atto
- Introdurre i personaggi al villaggio e ai PNG principali
- Stabilire l'atmosfera inquietante
- Fornire i primi indizi sul mistero della torre
- Motivare i personaggi a investigare

## Eventi Chiave

### Scena 1: L'Arrivo
I personaggi arrivano a Vallegrigia al tramonto. Il villaggio sembra deserto,
le strade sono vuote. Dall'interno delle case si sentono voci sussurrare in una
lingua incomprensibile.

**Atmosfera**: Inquietante, misteriosa, leggermente minacciosa.

**Indizi disponibili**:
- Le voci cessano quando i personaggi si avvicinano alle porte
- Impronte strane nel fango (forma umana ma dita troppo lunghe)
- Un corvo osserva i personaggi e li segue

### Scena 2: Incontro con Aldric
Il borgomastro Aldric li aspetta alla locanda "Il Viandante Stanco".
È visibilmente spaventato e stanco.

**Dialogo chiave**:
"Tre notti fa, durante la luna nuova, un lampo verde ha illuminato la foresta.
Al mattino, la torre c'era. Non c'è sentiero che porta ad essa, eppure i bambini
del villaggio la disegnano nei loro sogni."

**Informazioni che fornisce**:
- La torre è apparsa 3 notti fa
- I fenomeni strani sono iniziati la notte stessa
- Nessuno ha ancora osato avvicinarsi
- Offrirà 500 mo per investigare

### Scena 3: Esplorazione del Villaggio
I personaggi possono esplorare e parlare con gli abitanti.

**PNG disponibili**:
- **Elara** (guaritrice): Ha provato cure ma non funzionano. Parla di "energie antiche"
- **Tomás** (fabbro): Suo figlio disegna simboli strani. Gli attrezzi si magnetizzano da soli
- **Sorella Miriam** (sacerdotessa): Le preghiere sembrano inefficaci. Il tempio è freddo

**Indizi aggiuntivi**:
- I disegni dei bambini mostrano la stessa torre da angolazioni diverse
- Gli animali evitano una direzione specifica (quella della torre)
- Le piante nella direzione della torre sono leggermente appassite

## Possibili Deviazioni

### Se i giocatori vogliono andare subito alla torre
Non impedirlo, ma rendi chiaro che avere più informazioni sarebbe saggio.
Aldric può esprimere preoccupazione e offrire di preparare provviste per il giorno dopo.

### Se i giocatori sospettano degli abitanti
Lascia che indaghino, ma tutti gli abitanti sono vittime innocenti.
Possono trovare i simboli disegnati dai bambini che corrispondono a rune antiche.

## Transizione all'Atto 2
L'atto si conclude quando i personaggi decidono di dirigersi verso la torre.
Questo dovrebbe avvenire naturalmente dopo aver raccolto informazioni sufficienti.
```

### Pagina: PNG Principali

Dedica una pagina ai personaggi non giocanti più importanti.

**Esempio**:

```markdown
# PNG Principali

## Aldric il Borgomastro

**Ruolo**: Quest giver, fonte di informazioni
**Personalità**: Preoccupato, protettivo verso il villaggio, pragmatico
**Aspetto**: Uomo sulla cinquantina, capelli grigi, occhiaie profonde
**Motivazione**: Proteggere gli abitanti del villaggio a ogni costo

**Informazioni chiave che possiede**:
- Storia del villaggio e della foresta
- Dettagli sui fenomeni strani
- Contatti con villaggi vicini
- Leggende locali sulla foresta antica

**Dialoghi caratteristici**:
- "Ho visto molte stagioni, ma nulla di simile..."
- "Il mio dovere è verso questi abitanti. Farò qualsiasi cosa."
- "Non sono superstizioso, ma questa volta... ho paura."

**Se i giocatori lo sospettano**: Sarà ferito ma comprensivo. Offre di essere interrogato con magia se necessario.

---

## Elara la Guaritrice

**Ruolo**: Esperta di erbe e magie curative minori
**Personalità**: Calma, saggia, curiosa intellettualmente
**Aspetto**: Donna anziana, capelli bianchi intrecciati, occhi verdi penetranti
**Motivazione**: Comprendere la natura dei fenomeni per trovare una cura

**Conoscenze utili**:
- Erboristeria e alchimia
- Anatomia e sintomi insoliti
- Leggende su magie antiche
- Conosce le proprietà delle piante della foresta

**Dialoghi caratteristici**:
- "La natura ha un equilibrio. Questo lo ha spezzato."
- "Ho visto ferite che si curano da sole, ma mai... questo."
- "Gli antichi conoscevano segreti che abbiamo dimenticato."

**Ruolo nell'avventura**: Può identificare gli effetti magici sui villici e fornire protezioni parziali.

---

## L'Entità della Torre (Revelato nell'Atto 3)

**Nome antico**: Vaelthys
**Natura**: Entità planare di allineamento neutrale
**Aspetto**: Forma umanoide fluida di energia viola, occhi che riflettono galassie
**Motivazione**: Essere liberata dopo millenni di prigionia

**Verità sulla sua prigionia**:
Vaelthys fu imprigionata 800 anni fa da un concilio di maghi che la consideravano
pericolosa. In realtà, era solo incompresa: la sua natura aliena causava effetti
involontari sul tessuto della realtà.

**Cosa può offrire ai personaggi**:
- Conoscenze planari antiche
- Un dono (capacità magica minore)
- Ricompensa materiale (gemme planari)

**Se viene liberata**: Ringrazia i personaggi e svanisce nel suo piano d'origine.
I fenomeni cessano immediatamente.

**Se viene imprigionata di nuovo**: Accetta tristemente il suo destino.
I fenomeni cessano ma lei rimane sola per altri secoli.

**Dialoghi chiave**:
- "Millenni... voi non potete comprendere millenni di solitudine."
- "Non chiedo perdono, chiedo solo comprensione."
- "La vostra scelta definirà chi siete, non chi sono io."
```

### Pagina: Luoghi Importanti

Descrivi i luoghi chiave con dettagli utili per l'AI.

**Esempio**:

```markdown
# Luoghi Importanti

## Il Villaggio di Vallegrigia

**Descrizione generale**:
Piccolo villaggio agricolo di circa 200 abitanti, situato ai margini della
Foresta Vetusta. Costruzioni principalmente in legno e pietra, con il tempio
di Peloria come edificio più grande.

**Atmosfera normale**: Tranquillo, laborioso, accogliente
**Atmosfera attuale**: Inquietante, sospeso, pervaso da tensione

**Edifici principali**:
- Locanda "Il Viandante Stanco" (punto d'incontro)
- Casa del borgomastro (edificio a due piani, ben tenuto)
- Tempio di Peloria (pietra bianca, giardino curato)
- Fucina di Tomás (sempre con fuoco acceso)
- Bottega di Elara (piante medicinali ovunque)

**Geografia**:
- A sud: campi coltivati
- A nord: Foresta Vetusta (dove è apparsa la torre)
- A est: strada per la città di Merivald (3 giorni di viaggio)
- A ovest: colline e pascoli

---

## La Torre Dimensionale

**Aspetto esterno**:
Torre cilindrica di 30 metri, costruita con una pietra nera lucida che sembra
assorbire la luce. Rune luminose viola pulsano irregolarmente sulla superficie.
Nessuna porta o finestra visibile dal basso.

**Atmosfera**: Aliena, antica, pulsante di energia magica

**Geografia**:
Appare in una radura nella Foresta Vetusta, a circa 2 ore di cammino dal villaggio.
La vegetazione attorno è leggermente appassita in un raggio di 20 metri.

**Come entrarci**:
L'ingresso si manifesta solo al tramonto o con un rituale specifico
(indizi trovabili nei disegni dei bambini).

**Interno - Piano Terra**:
Sala circolare con pavimento di vetro che mostra galassie sotto i piedi.
Quattro statue di figure incappucciate puntano verso l'alto. Scala a spirale centrale.

**Interno - Piani Superiori**:
Ogni piano contiene enigmi legati a elementi (terra, aria, fuoco, acqua).
Le soluzioni richiedono cooperazione o intuizioni creative, non solo forza.

**Interno - Cima**:
Camera ottagonale con Vaelthys al centro, circondata da catene di energia magica.
Un cerchio di controllo sul pavimento permette di rafforzare o dissolvere le catene.

**Pericoli**:
- Guardiani magici (costrutti di energia, non ostili se non minacciati)
- Trappole dimensionali (teletrasporto in altre stanze)
- Distorsioni temporali (pochi secondi possono sembrare ore)

---

## La Foresta Vetusta

**Descrizione**:
Foresta antica che circonda Vallegrigia. Alberi secolari, poca luce solare al suolo,
muschio ovunque. Normalmente tranquilla, ora pervasa da un'energia innaturale.

**Atmosfera attuale**: Tesa, silenziosa (nessun canto di uccelli),
l'aria sembra "densa"

**Incontri possibili**:
- Animali che si comportano stranamente
- Fate minori confuse dai fenomeni magici
- Viandanti smarriti (potrebbero chiedere aiuto)

**Sfide**:
- Orientamento difficile (le normali tecniche di navigazione falliscono vicino alla torre)
- Fenomeni magici minori (luci fatue, echi di voci)
```

### Pagina: Segreti e Rivelazioni

Questa pagina dovrebbe contenere informazioni che i giocatori scopriranno gradualmente.

**Esempio**:

```markdown
# Segreti e Rivelazioni

## Il Vero Scopo della Torre

**Segreto**: La torre non è una struttura fisica, ma una prigione dimensionale
che si manifesta nel piano materiale quando l'energia di contenimento si indebolisce.

**Quando rivelarlo**: Quando i personaggi leggono le rune sulla torre o consultano
un esperto di magia planare.

**Impatto sulla storia**: Spiega perché la torre è apparsa "dal nulla" e
perché nessuno la ricorda.

---

## L'Innocenza di Vaelthys

**Segreto**: Vaelthys non è malvagia. La sua presenza causa effetti collaterali
perché la sua natura planare è incompatibile con il piano materiale,
ma non ha intenzioni ostili.

**Quando rivelarlo**: Durante il confronto finale, se i personaggi scelgono
di parlare invece di attaccare.

**Prove a sostegno**:
- Nessun danno permanente ai villici
- Vaelthys offre cooperazione, non resistenza
- Documenti antichi nella torre mostrano che fu imprigionata senza processo

**Impatto sulla storia**: Crea un dilemma morale - è giusto imprigionare
qualcuno solo perché la sua esistenza è problematica?

---

## Il Concilio Dimenticato

**Segreto**: 800 anni fa, un concilio di maghi chiamato "Gli Osservatori del Velo"
imprigionò Vaelthys. Non erano malvagi, ma spaventati e precipitosi.

**Quando rivelarlo**: Trovando documenti nella torre o parlando con Vaelthys.

**Dettagli**:
- Il concilio si è estinto secoli fa
- Pensavano di proteggere il mondo
- Non hanno considerato alternative alla prigionia

**Impatto sulla storia**: Mostra che anche le buone intenzioni possono causare
sofferenza. Aggiunge profondità morale.

---

## La Scelta dei Personaggi Ha Conseguenze

**Segreto**: Non esiste una soluzione "corretta". Ogni scelta ha pro e contro.

**Se liberano Vaelthys**:
- ✅ Lei è libera e grata
- ✅ Fenomeni cessano immediatamente
- ✅ I personaggi ricevono una ricompensa
- ❌ Possibile (ma non certo) ritorno futuro di problemi simili

**Se imprigionano nuovamente Vaelthys**:
- ✅ Fenomeni cessano
- ✅ Il villaggio è "protetto" a lungo termine
- ❌ Un'entità innocente soffre
- ❌ I personaggi devono convivere con questa scelta

**Quando rivelarlo**: Dopo la scelta finale, nelle sessioni successive,
attraverso conseguenze narrative coerenti.
```

## Consigli per Contenuto AI-Friendly

### Chiarezza e Specificità

**✅ BUONO**:
```
Il borgomastro Aldric è preoccupato per i bambini del villaggio.
Offrirà 500 mo ai personaggi se investigano la torre misteriosa.
```

**❌ DA EVITARE**:
```
Aldric vuole che facciano qualcosa per la cosa che è apparsa.
```

### Usa Titoli Descrittivi

I titoli aiutano l'AI a comprendere il contesto:

**✅ BUONO**:
```markdown
## Atto 2: Esplorazione della Torre
## PNG: Vaelthys l'Entità Prigioniera
## Luogo: Foresta Vetusta
```

**❌ DA EVITARE**:
```markdown
## Parte 2
## Personaggio 3
## Posto importante
```

### Struttura Gerarchica

Usa intestazioni di livello appropriato:

```markdown
# Titolo Principale (H1) - Una volta per pagina
## Sezioni Principali (H2) - Argomenti principali
### Sottosezioni (H3) - Dettagli specifici
#### Dettagli Minori (H4) - Approfondimenti
```

### Includi Motivazioni e Obiettivi

L'AI comprende meglio le dinamiche se specifichi il "perché":

**✅ BUONO**:
```
Aldric vuole proteggere il villaggio a ogni costo perché ha perso
la sua famiglia in un attacco di goblin anni fa. Non permetterà
che succeda di nuovo.
```

**❌ DA EVITARE**:
```
Aldric vuole aiuto.
```

### Specifica Conseguenze

Indica cosa succede con diverse scelte:

**✅ BUONO**:
```
Se i personaggi attaccano Vaelthys immediatamente:
- Lei si difende ma non contrattacca letalmente
- I fenomeni nel villaggio peggiorano
- Perdono l'opportunità di capire la verità

Se i personaggi parlano con Vaelthys:
- Lei spiega la sua storia
- Offre cooperazione
- Si apre la possibilità di una soluzione pacifica
```

### Usa Liste e Tabelle

Rendono le informazioni più facili da scansionare per l'AI:

**✅ BUONO**:
```markdown
**Indizi disponibili nella stanza**:
- Libro di rune aperto sul tavolo
- Mappa con la torre cerchiata in rosso
- Lettera a metà scritta
```

**✅ OTTIMO** (con tabella):
```markdown
| Indizio | Dove | Cosa Rivela |
|---------|------|-------------|
| Libro di rune | Tavolo | Identità di Vaelthys |
| Mappa | Parete | Posizione della torre |
| Lettera | Cassetto | Intenzioni del concilio |
```

## Cosa Includere e Cosa Evitare

### ✅ DA INCLUDERE

| Elemento | Perché |
|----------|--------|
| **Obiettivi chiari** | L'AI sa cosa suggerire per farli progredire |
| **Motivazioni PNG** | Suggerimenti più realistici e consistenti |
| **Atmosfera descrittiva** | L'AI può generare testo narrativo appropriato |
| **Conseguenze delle scelte** | Rilevamento migliore delle deviazioni |
| **Dialoghi esempio** | L'AI comprende il tono e lo stile |
| **Alternative e flessibilità** | L'AI gestisce meglio l'improvvisazione |
| **Indizi graduali** | Suggerimenti progressivi invece che rivelazioni brusche |

### ❌ DA EVITARE

| Elemento | Perché Problematico |
|----------|---------------------|
| **Statistiche di gioco** | L'AI non ha bisogno di CA, PF, danni (a meno che non siano narrativamente rilevanti) |
| **Testi troppo lunghi** | Consumano token e rallentano l'analisi |
| **Riferimenti esterni** | "Vedi pagina 45 del manuale" - l'AI non può accedere |
| **Abbreviazioni oscure** | Scrivi per esteso o spiega gli acronimi |
| **Formattazione complessa** | Tabelle annidate, colori, font - usa markdown semplice |
| **Contenuto non narrativo** | Liste di tesori generici, tabelle random - meglio informazioni contestuali |

## Do's and Don'ts

### ✅ DO - Fai Così

#### Scrivi Obiettivi Chiari per Ogni Atto
```markdown
## Obiettivi dell'Atto 1
1. I personaggi devono incontrare Aldric e accettare la quest
2. Devono raccogliere almeno 3 indizi sul mistero della torre
3. Devono decidere di investigare la torre
```

#### Fornisci Esempi di Dialogo
```markdown
**Aldric quando i personaggi arrivano**:
"Grazie agli dei che siete qui! Ho mandato messaggeri a Merivald
ma... temo che non ci sia tempo."
```

#### Spiega Connessioni tra Eventi
```markdown
I disegni dei bambini mostrano la torre perché Vaelthys sta cercando
di comunicare attraverso i sogni. Non è un attacco, è una richiesta di aiuto.
```

#### Offri Alternative
```markdown
**Se i giocatori non vogliono andare alla torre**:
- Aldric può aumentare la ricompensa
- Può arrivare un PNG in pericolo dalla foresta
- I fenomeni possono peggiorare fino a diventare pericolosi
```

#### Descrivi Atmosfera e Sensazioni
```markdown
**Atmosfera della torre**: L'aria sembra vibrare con energia magica.
Un suono come un respiro lento permea tutto. La luce delle torce
ha una sfumatura violacea innaturale.
```

### ❌ DON'T - Non Fare Così

#### Non Usare Solo Statistiche
```markdown
❌ BAD:
Goblin - CA 15, PF 7, Attacco +4, Danno 1d6+2

✅ GOOD:
Gruppo di goblin spaventati che si sono rifugiati nella torre.
Attaccano solo se minacciati. Il loro leader, Grix, parla Common
e può diventare un alleato se i personaggi mostrano pietà.
```

#### Non Essere Vago
```markdown
❌ BAD:
"Succede qualcosa di strano nella torre."

✅ GOOD:
"Le pareti della torre pulsano con luce viola a ritmo di respiro.
Quando i personaggi si avvicinano, sentono un sussurro mentale:
'Finalmente... qualcuno mi sente...'"
```

#### Non Dimenticare le Motivazioni
```markdown
❌ BAD:
"Il PNG vuole che i personaggi entrino nella torre."

✅ GOOD:
"Elara vuole che i personaggi entrino nella torre perché crede
che la fonte della malattia dei villici sia lì dentro. È disposta
a offrire le sue migliori pozioni per aiutarli."
```

#### Non Scrivere Solo per Te
```markdown
❌ BAD:
"Vedi appunti sessione precedente per dettagli PNG."

✅ GOOD:
"Elara è una guaritrice anziana che ha aiutato i personaggi
nella sessione precedente curando le loro ferite dopo lo
scontro con i lupi infetti."
```

#### Non Includere Meta-informazioni Inutili
```markdown
❌ BAD:
"Questo PNG è importante per la trama quindi NON DEVE MORIRE."

✅ GOOD:
"Aldric è essenziale per la quest. Se dovesse morire prima di
rivelare informazioni chiave, sua figlia Mira può fornire le
stesse informazioni leggendo il diario del padre."
```

## Lunghezza Ottimale

### Linee Guida per le Dimensioni

| Tipo di Pagina | Lunghezza Consigliata | Motivo |
|----------------|----------------------|--------|
| Panoramica | 300-500 parole | Contesto sufficiente senza sovraccarico |
| Atto/Capitolo | 500-800 parole | Dettagli per un'intera sessione |
| PNG Principale | 200-300 parole | Personalità e ruolo chiari |
| PNG Secondario | 100-150 parole | Solo informazioni essenziali |
| Luogo | 200-400 parole | Atmosfera e dettagli rilevanti |
| Segreto | 100-200 parole | Conciso ma completo |

### Bilanciamento Token/Dettaglio

**Ricorda**: Più contenuto = più token = costi maggiori

**Strategia consigliata**:
- **Dettagliato**: Atti correnti e PNG attivi
- **Sintetico**: Atti futuri e PNG non ancora incontrati
- **Essenziale**: Background e storia generale

## Esempio Completo: Struttura di un Journal

Ecco un esempio di struttura completa per una breve avventura:

```
📖 Journal: "Il Mistero della Torre"

📄 1. Panoramica dell'Avventura (400 parole)
   - Trama principale
   - Obiettivo finale
   - Tema centrale
   - Durata prevista

📄 2. Atto 1: Arrivo al Villaggio (700 parole)
   - Obiettivi dell'atto
   - Scena 1: L'arrivo
   - Scena 2: Incontro con Aldric
   - Scena 3: Esplorazione villaggio
   - Possibili deviazioni
   - Transizione all'Atto 2

📄 3. Atto 2: Indagini alla Torre (700 parole)
   - Obiettivi dell'atto
   - Viaggio nella foresta
   - Primo ingresso nella torre
   - Esplorazione dei piani
   - Enigmi e sfide
   - Transizione all'Atto 3

📄 4. Atto 3: Il Confronto Finale (600 parole)
   - Obiettivi dell'atto
   - Incontro con Vaelthys
   - Rivelazione della verità
   - Scelta morale dei personaggi
   - Conseguenze delle scelte
   - Risoluzione

📄 5. PNG Principali (600 parole)
   - Aldric (borgomastro)
   - Elara (guaritrice)
   - Vaelthys (entità)
   - Altri PNG rilevanti

📄 6. Luoghi Importanti (500 parole)
   - Villaggio di Vallegrigia
   - Torre Dimensionale
   - Foresta Vetusta

📄 7. Segreti e Rivelazioni (400 parole)
   - Vero scopo della torre
   - Innocenza di Vaelthys
   - Il Concilio Dimenticato
   - Conseguenze delle scelte

TOTALE: ~3900 parole (circa 5200 token)
```

## Aggiornamento Durante la Campagna

### Quando Aggiornare

| Momento | Cosa Aggiornare | Perché |
|---------|-----------------|--------|
| **Dopo ogni sessione** | Note su scelte dei giocatori | L'AI considera le decisioni prese |
| **Quando cambiano piani** | Eventi futuri modificati | Suggerimenti coerenti con i nuovi piani |
| **Nuovi PNG importanti** | Aggiungi alla pagina PNG | Riferimenti accurati |
| **Trama deviata** | Crea nuove pagine per archi alternativi | Supporta l'improvvisazione |

### Come Aggiornare

**✅ Metodo consigliato**:
```markdown
## [AGGIORNAMENTO POST-SESSIONE 3]

I personaggi hanno scelto di liberare Vaelthys immediatamente,
senza completare gli enigmi della torre. Vaelthys è grata ma la
liberazione improvvisa ha causato un'esplosione magica che ha
danneggiato parte del villaggio.

**Nuova direzione**:
- I personaggi devono aiutare a riparare i danni
- Aldric è deluso ma comprensivo
- Vaelthys offre assistenza prima di partire
```

**Aggiunta di note temporanee**:
```markdown
> **[NOTA SESSIONE CORRENTE]**: I giocatori sospettano fortemente
> di Elara. Preparare indizi che scagionino o confermino i sospetti.
```

## Integrazione con Narrator Master

### Come il Modulo USA il Journal

1. **All'avvio**: Indicizza tutte le pagine di testo del Journal selezionato
2. **Durante la registrazione**: Confronta trascrizione con contenuto Journal
3. **Generazione suggerimenti**: Usa contesto Journal + trascrizione recente
4. **Rilevamento off-track**: Identifica quando la conversazione si allontana dal contenuto Journal

### Ottimizzazione per il Modulo

**Cache e Performance**:
- Il modulo cachea il contenuto del Journal dopo la prima lettura
- Clicca "Ricarica Journal" se hai fatto modifiche durante la sessione
- Journal più piccoli = risposte AI più veloci

**Selezione Journal Multipli**:
Attualmente il modulo supporta UN journal alla volta. Se hai contenuto in journal separati:
- **Opzione 1**: Copia tutto in un unico Journal
- **Opzione 2**: Usa il Journal per l'atto corrente, cambia quando passi al successivo

## Riferimenti Correlati

Per sfruttare al meglio il Journal con Narrator Master, consulta anche:

- **[Guida all'Utilizzo](./usage.md)** - Come usare il pannello DM e le funzionalità di trascrizione
  - Sezione "Integrazione Journal" per dettagli su selezione e ricarica
  - Sezione "Suggerimenti AI" per comprendere come vengono generati

- **[Guida alla Configurazione](./configuration.md)** - Come configurare il modulo
  - Sezione "Journal dell'Avventura" per impostare il Journal predefinito
  - Sezione "Sensibilità Rilevamento Fuori Tema" per calibrare il rilevamento

- **[Risoluzione Problemi](./troubleshooting.md)** - Se i suggerimenti non sono accurati
  - Sezione "Suggerimenti non pertinenti" per diagnosi e soluzioni
  - Sezione "Ottimizzazione costi" per bilanciare dettaglio e token

## Conclusione

Un Journal ben strutturato è la chiave per ottenere il massimo da Narrator Master. Ricorda:

1. **Chiarezza sopra tutto** - Scrivi in modo che l'AI comprenda il contesto
2. **Struttura gerarchica** - Usa intestazioni e organizzazione logica
3. **Includi motivazioni** - Spiega il "perché" delle azioni
4. **Sii specifico** - Evita vaghezza e riferimenti esterni
5. **Mantienilo aggiornato** - Rifletti i cambiamenti della campagna

Seguendo queste linee guida, l'AI di Narrator Master potrà fornirti suggerimenti accurati,
rilevare deviazioni dalla trama, e supportarti efficacemente durante le tue sessioni di gioco.

**Buona fortuna, Game Master!** 🎲
