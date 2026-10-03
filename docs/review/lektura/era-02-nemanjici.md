# Proof report — nemanjici (days 046–105)

## Counts
- Lessons read: 60 (046–105), each fully, top to bottom
- Lessons changed: 58 (unchanged: 055, 089)
- Total edits: 168 — grammar 122 / orthography 38 / house style 0 / de-tick 8
- Word counts: all lessons within ±1% of original; no reading-time change (checked with countWords logic from packages/content/src/loader/readingTime.ts).
- Validation: `pnpm validate-content` returned a turbo cache hit; ran `npx tsx src/loader/validateContentFiles.ts` directly in packages/content: ✓ 365 lessons, no errors.
- House style: no Habsburšk-/Austro-Ugarska/Knjeginja/reader-address issues present in this range. Lowercase "srpska crkva" is dominant; I lowercased two stray "Srpske crkve" (056, 064) and left the institutional uses.

## Every edit

| day | cat | before → after |
|---|---|---|
| 046 | grammar | „prošlo je gotovo tri stoleća” → „prošla su gotovo tri stoleća” |
| 046 | orthography | „U toj priči, dva imena” → „U toj priči dva imena” |
| 046 | grammar | „tu su se sustizali putevi” → „tu su se sticali putevi” |
| 046 | grammar | „što je upravo dolaskom sa mora i bilo moguće” → „što joj je upravo položaj uz more i omogućavao” |
| 046 | orthography | „Na kratko se činilo” → „Nakratko se činilo” |
| 047 | grammar | „sa par stranica vizantijskih pisaca i jednom kasnijom, deo legendom natopljenom” → „sa nekoliko stranica vizantijskih pisaca i jednom kasnijom, delom legendom natopljenom” |
| 047 | grammar | „i njome ulazi srpsko ime u redovan” → „i njome srpsko ime ulazi u redovan” |
| 047 | grammar | „a u svoja srodstva on je postavljao rođake kao namesnike” → „a svoje rođake postavljao je kao namesnike” |
| 048 | grammar | „do upravljanja županijom” → „do upravljanja župom” |
| 048 | grammar | „primorski i zalednički,” → „primorski i zaleđinski,” |
| 048 | grammar | „Stariji braća” → „Starija braća” |
| 048 | de-tick | „Za sada je dovoljno reći da je čovek koji će kasnije pisati istoriju srpske države već formiran:” → „Ipak, čovek koji će kasnije pisati istoriju srpske države već je formiran:” |
| 049 | grammar | „koja se istoričarima naravno čita kao” → „koju istoričari, naravno, čitaju kao” |
| 050 | grammar | „pripadaju njegovom uticajnom krugu” → „pripadaju krugu njegovog uticaja” |
| 050 | orthography | „delovi pomoravlja” → „delovi Pomoravlja” |
| 050 | grammar | „gde su pod njegovom rukom postepeno došli i Prizren” → „gde su pod njegovu ruku došli i Prizren” |
| 050 | grammar | „suparnici oko granica oko Save i Dunava” → „suparnici oko granica na Savi i Dunavu” |
| 050 | grammar | „biti pošten oko izvora” → „biti pošten prema izvorima” |
| 051 | orthography | „koji ni jedan vladar Raške” → „koji nijedan vladar Raške” |
| 051 | grammar | „kao podriv društvenog poretka” → „kao pretnja društvenom poretku” |
| 052 | grammar | „sapatnica mnogih godina vlasti” → „saputnica mnogih godina vlasti” |
| 053 | grammar | „sa pravom da se njime sami upravljaju” → „sa pravom da njime sami upravljaju” |
| 053 | grammar | „i monah koji će svoju zemlju dobiti kao crkvu” → „i monah koji će svojoj zemlji podariti crkvu” |
| 054 | grammar | „koje je voljno isticalo” → „koje je rado isticalo” |
| 054 | grammar | „Kratko po postrigu Sava” → „Ubrzo posle postriga Sava” |
| 054 | grammar | „monaha koji posluša, ćuti i radi” → „monaha koji sluša, ćuti i radi” |
| 054 | grammar | „koji će kasnije, sa drugačijim autoritetom, vratiti se u srpsku istoriju” → „koji će se kasnije, sa drugačijim autoritetom, vratiti u srpsku istoriju” |
| 054 | de-tick | „Za sada je dovoljno reći: u nekom” → „Za sada ostaje ovo: u nekom” |
| 056 | grammar | „gotovo izazivajući potez” → „gotovo izazovan potez” |
| 056 | grammar | „Stefan se sklonio kod bugarskog dvora” → „Stefan se sklonio na bugarski dvor” |
| 056 | orthography | „sa autokefalnošću Srpske crkve” → „sa autokefalnošću srpske crkve” |
| 057 | orthography | „imala je od skora i kraljevsku” → „imala je odskora i kraljevsku” |
| 057 | grammar | „pad Carigrada u rukama latinskih krstaša” → „pad Carigrada u ruke latinskih krstaša” |
| 058 | grammar | „Žiču je Sava i sam osvetio” → „Žiču je Sava i sam osveštao” |
| 058 | grammar | „krunisao — ili svečano potvrdio krunu — svome bratu Stefanu, koji” → „krunisao — ili mu svečano potvrdio krunu — svoga brata Stefana, koji” |
| 059 | grammar | „i prema jugu prema Lipljanu i Prizrenu” → „i na jugu prema Lipljanu i Prizrenu” |
| 059 | orthography | „Hilandara i Svete gore” → „Hilandara i Svete Gore” |
| 060 | de-tick | „Ovde je dovoljno reći da Savin život, ako se sagleda kao celina, ima” → „Savin život, ako se sagleda kao celina, ima” |
| 061 | grammar | „i obojica će na kraju biti zbačena od strane mlađeg brata.” → „i obojicu će na kraju zbaciti mlađi brat.” |
| 061 | grammar | „Bugarska je postala neosporna prevaga na Balkanu” → „Bugarska je stekla neospornu prevagu na Balkanu” |
| 062 | grammar | „Pred njim su bili stariji braća” → „Pred njim su bila starija braća” |
| 062 | grammar | „Njegovi braća vladali su” → „Njegova braća vladala su” |
| 062 | grammar | „prethodne ovisnosti” → „prethodne zavisnosti” |
| 062 | de-tick | „biće više reči u zasebnoj lekciji; ovde je dovoljno reći da je taj brak otvorio” → „biće više reči u zasebnoj lekciji, ali već je sam taj brak otvorio” |
| 062 | grammar | „došao je do otvorenog rata sa Dubrovnikom” → „došlo je do otvorenog rata sa Dubrovnikom” |
| 062 | grammar | „da ga obnovljena Vizantija pod sposobnim carem ne sme imati za stalnog neprijatelja” → „da obnovljenu Vizantiju pod sposobnim carem ne sme imati za stalnog neprijatelja” |
| 062 | grammar | „Razlozi su bili više:” → „Razloga je bilo više:” |
| 063 | grammar | „vodu za pokretanje mehova i meha za topljenje” → „vodu za pokretanje mehova za topljenje” |
| 063 | grammar | „Sedmogradja i Spiša” → „Sedmogradske i Spiša” |
| 063 | grammar | „kroz pažljivo dovedeno ciljano doseljavanje” → „kroz pažljivo vođeno, ciljano doseljavanje” |
| 063 | grammar | „kao darovnu priliku” → „kao dobrodošlu priliku” |
| 063 | orthography | „sopstvene večnike” → „sopstvene većnike” |
| 063 | grammar | „za srpske prilike preokretna” → „za srpske prilike prelomna” |
| 063 | orthography | „plitkog rovenja” → „plitkog rovanja” |
| 063 | grammar | „čim Sasa otera neki samovoljni župan” → „čim Sase otera neki samovoljni župan” |
| 064 | orthography | „za sveticu Srpske crkve” → „za sveticu srpske crkve” |
| 064 | grammar | „jedna od retkih osoba koja je imala uticaj” → „jedna od retkih osoba koje su imale uticaj” |
| 064 | grammar | „zadužila je više pravoslavnih hramova” → „obdarila je više pravoslavnih hramova” |
| 065 | orthography | „naročito u Bosni gde je” → „naročito u Bosni, gde je” |
| 065 | grammar | „povučen u monaški postrig pod imenom Teoktist” → „povučen u monaštvo pod imenom Teoktist” |
| 065 | grammar | „a Vladislavovi pokušaji da održi nasleđe brzo su slomljeni od strane snažnijeg strica” → „a Vladislavove pokušaje da održi nasleđe brzo je slomio snažniji stric” |
| 066 | grammar | „do Polog i do oblasti” → „do Pologa i do oblasti” |
| 066 | grammar | „propali ili završili polovičnim uspesima” → „propali ili se završili polovičnim uspesima” |
| 066 | grammar | „Imao je, jedno za drugim, više supruga” → „Imao je, jednu za drugom, više supruga” |
| 067 | orthography | „Suvremenici su govorili” → „Savremenici su govorili” |
| 067 | orthography | „i ni jedna strana nije” → „i nijedna strana nije” |
| 067 | grammar | „izbaci sa zauzetih oblasti” → „izbaci iz zauzetih oblasti” |
| 067 | grammar | „najamnička vojska doneta da brani Carstvo” → „najamnička vojska dovedena da brani Carstvo” |
| 067 | grammar | „ponekad zaratovala oko nasledstva” → „ponekad ratovala oko nasledstva” |
| 067 | grammar | „Pojedinosti pojedinih razgovora” → „Pojedinosti mnogih razgovora” |
| 067 | grammar | „rimske kurije su mu pisale” → „rimska kurija mu je pisala” |
| 068 | grammar | „sistematski okretao u kamen” → „sistematski pretvarao u kamen” |
| 068 | grammar | „dao je sagraditi novi glavni hram” → „podigao je novi glavni hram” |
| 068 | de-tick | „Ovde je dovoljno reći da je reč o crkvama” → „Ukratko, reč je o crkvama” |
| 069 | grammar | „kao zaokrugljeno delo” → „kao zaokruženo delo” |
| 069 | grammar | „u Staro Nagoričinu kod Kumanova” → „u Starom Nagoričinu kod Kumanova” |
| 069 | orthography | „na listu Svetske baštine” → „na listu svetske baštine” |
| 070 | grammar | „sukob sa Bugarskom carstvu pod Mihailom” → „sukob sa Bugarskim carstvom pod Mihailom” |
| 070 | orthography | „dostojan očevog Banjskog i dedinog Studeničkog kruga” → „dostojan očevog banjskog i dedinog studeničkog kruga” |
| 070 | grammar | „uz podršku zetske i jedne drugih oblasnih gospoda” → „uz podršku zetske i druge oblasne gospode” |
| 070 | grammar | „čiji je život počeo i završio u istoj” → „čiji je život počeo i završio se u istoj” |
| 071 | grammar | „zatvori između dva mlina” → „zatvori između dva mlinska kamena” |
| 071 | grammar | „koja od dve neprijateljske vojske će prva stići” → „koja će od dve neprijateljske vojske prva stići” |
| 071 | grammar | „Pregovaralo se, slalo izaslanike, govorilo” → „Pregovaralo se, slali su se izaslanici, govorilo se” |
| 071 | grammar | „namerno ili u sledu rana” → „namerno ili od posledica rana” |
| 071 | grammar | „uloga u kojoj će je narednih decenija” → „uloga koja će je narednih decenija” |
| 072 | grammar | „verovatno doteranom iz primorja” → „verovatno dovedenom iz primorja” |
| 072 | orthography | „svojevrsna sinteza istoka i zapada” → „svojevrsna sinteza Istoka i Zapada” |
| 072 | grammar | „i čine ga radionice više zografa” → „a radile su ga radionice više zografa” |
| 073 | grammar | „Kada se 1321. godine, posle Milutinove smrti, Stefan Dečanski uspeo da nametne za kralja” → „Kada je 1321. godine, posle Milutinove smrti, Stefan Dečanski uspeo da se nametne za kralja” |
| 073 | grammar | „hrabrost u tom danu bila zapamćena” → „hrabrost tog dana bila zapamćena” |
| 074 | grammar | „Svaka promena saveza pratila je novi pohod” → „Svaku promenu saveza pratio je novi pohod” |
| 074 | grammar | „Kako se proširivao, Dušan je državu” → „Kako je osvajao, Dušan je državu” |
| 074 | orthography | „Pravo unutrašnje uređenje, grčki jezik” → „Pravo, unutrašnje uređenje, grčki jezik” |
| 074 | grammar | „postao je modelski primer” → „postao je ogledni primer” |
| 074 | grammar | „nije podvrgavao srpskoj koloniji” → „nije podvrgavao srpskoj kolonizaciji” |
| 075 | de-tick | „; ovde je dovoljno reći da je crkveno uzvišenje bilo neodvojivi uslov državnog.” → „; crkveno uzvišenje bilo je neodvojivi uslov državnog.” |
| 075 | grammar | „ravna toj titulu” → „ravna toj tituli” |
| 075 | grammar | „kada će biti svečano izmiren” → „kada će biti svečano okončan” |
| 076 | grammar | „Tako se na proleće 1346.” → „Tako se u proleće 1346.” |
| 076 | orthography | „novostečenih dušanovih grčkih oblasti” → „novostečenih Dušanovih grčkih oblasti” |
| 074 | orthography | „između regenstva mladog Jovana V” → „između regentstva mladog Jovana V” |
| 077 | grammar | „činio jedan ud složenog” → „činio jedan deo složenog” |
| 077 | de-tick | „Ovde je dovoljno zapamtiti okvir:” → „Za sada valja zapamtiti okvir:” |
| 078 | grammar | „Donet u dva navrata, 1349. i dopunjen 1354. godine” → „Donet u dva navrata, 1349. i 1354. godine” |
| 078 | grammar | „ne uređuje sve, nego upravo ono” → „ne uređuje sve, nego baš ono” |
| 078 | grammar | „teža dela vode sakaćenju, a izdaja vladara i najteža nasilna dela smrti.” → „teža dela povlače sakaćenje, a izdaja vladara i najteža nasilna dela smrt.” |
| 078 | grammar | „tamo gde se pokazala korisnima” → „tamo gde su se pokazala korisnim” |
| 079 | grammar | „a u opasnost lova podseća” → „a na opasnost lova podseća” |
| 079 | orthography | „reda u sedanju” → „reda u sedenju” |
| 079 | grammar | „pisari, redovno obrazovani u manastirima” → „pisari, po pravilu obrazovani u manastirima” |
| 080 | orthography | „bez kojih ni jedna naredba ne bi stigla do sela, ni jedna vojska ne bi izašla iz utvrđenja, ni jedan porez” → „bez kojih nijedna naredba ne bi stigla do sela, nijedna vojska ne bi izašla iz utvrđenja, nijedan porez” |
| 080 | grammar | „za gospodara čijoj se oblasti našao” → „za gospodara u čijoj se oblasti našao” |
| 080 | grammar | „moć vlastele ka kruni rasla je” → „moć vlastele u odnosu na krunu rasla je” |
| 080 | grammar | „trebaju onima koji su prečesto bivali kršeni” → „trebaju onima čija su prava prečesto bivala kršena” |
| 080 | grammar | „Kada se posle 1355. centralna vlast oslabila” → „Kada je posle 1355. centralna vlast oslabila” |
| 081 | grammar | „Najveći deo sebra činili su meropsi” → „Najveći deo sebara činili su meropsi” |
| 082 | de-tick | „Sve to znamo, treba pošteno reći, najviše” → „Sve to znamo, valja priznati, najviše” |
| 083 | grammar | „i tražen je od kovnica novca u Veneciji” → „i tražile su ga kovnice novca u Veneciji” |
| 083 | grammar | „da je u sredini 15. veka udeo” → „da je sredinom 15. veka udeo” |
| 084 | grammar | „ljudi koji su znali da postave i odgovore na pravno pitanje” → „ljudi koji su znali da postave pravno pitanje i odgovore na njega” |
| 084 | grammar | „sa tipikom, opštim trpezom” → „sa tipikom, opštom trpezom” |
| 084 | orthography | „vidljivo u Nemanjićko doba” → „vidljivo u nemanjićko doba” |
| 085 | orthography | „sa likom evanđeliste” → „sa likom jevanđeliste” |
| 086 | orthography | „uzlet srpskog fresko slikarstva” → „uzlet srpskog freskoslikarstva” |
| 086 | orthography | „Tako je srpsko fresko slikarstvo” → „Tako je srpsko freskoslikarstvo” |
| 086 | grammar | „na Svetoj Gori, ostalo je rasuto” → „na Svetoj Gori, a ostalo je rasuto” |
| 086 | grammar | „što se često zaboravi.” → „što se često zaboravlja.” |
| 087 | orthography | „lako je previdjeti koliko” → „lako je prevideti koliko” |
| 087 | grammar | „a putovi po kojima” → „a putevi po kojima” |
| 087 | orthography | „granica između istoka i zapada bila” → „granica između Istoka i Zapada bila” |
| 088 | orthography | „do palaiologovskog sjaja” → „do paleologovskog sjaja” |
| 088 | orthography | „kasnovizantijske, palaiologovske umetnosti” → „kasnovizantijske, paleologovske umetnosti” |
| 088 | orthography | „palaiologovski preporod” → „paleologovski preporod” |
| 088 | orthography | „Mihailo Astrapas i Eutihije” → „Mihailo Astrapas i Evtihije” |
| 090 | grammar | „Pomagala je gradnji crkava” → „Pomagala je gradnju crkava” |
| 090 | grammar | „Polovinu veka kasnije” → „Pola veka kasnije” |
| 090 | grammar | „Za neuporedivo većinski deo ženske populacije” → „Za neuporedivo veći deo ženske populacije” |
| 091 | grammar | „nastojali da svedu i da je zamene” → „nastojali da je suzbiju i zamene” |
| 092 | grammar | „držali u određenom mestu na karti” → „držali na određenom mestu na karti” |
| 092 | grammar | „krupne štitove badem-oblika” → „krupne štitove bademastog oblika” |
| 093 | orthography | „garantija o slobodnoj plovidbi” → „garancija o slobodnoj plovidbi” |
| 093 | grammar | „Dušanovo proglašenje cara 1346.” → „Dušanovo proglašenje za cara 1346.” |
| 093 | grammar | „čak i tako parčana slika” → „čak i tako fragmentarna slika” |
| 094 | grammar | „je svoj veliki župan stekao i izgubio” → „je svoj velikožupanski presto stekao i izgubio” |
| 094 | grammar | „Pad Carigrada 1204. godine u rukama Četvrtog krstaškog rata” → „Pad Carigrada 1204. godine u ruke krstaša Četvrtog krstaškog rata” |
| 094 | grammar | „do izgleda freski u Studenici” → „do izgleda fresaka u Studenici” |
| 095 | grammar | „srpsko-ugarski odnos prešao je preko svih lica koja” → „srpsko-ugarski odnos pokazao je sva lica koja” |
| 095 | grammar | „srpske pretendente koji su rivalisali tekućem vladaru” → „srpske pretendente suprotstavljene vladaru na prestolu” |
| 095 | grammar | „vratio je staru pritisak” → „vratio je stari pritisak” |
| 096 | orthography | „bilo lako previdjeti na karti” → „bilo lako prevideti na karti” |
| 096 | grammar | „potvrđivane stare slobode, dodavale nove i precizirale stope carine” → „potvrđivane stare slobode, dodavane nove i precizirane stope carine” |
| 097 | grammar | „Od tog trenutka pa unapred” → „Od tog trenutka pa nadalje” |
| 097 | orthography | „Bez Hilandarske biblioteke” → „Bez hilandarske biblioteke” |
| 098 | grammar | „u Jazak u Fruškoj gori” → „u Jazak na Fruškoj gori” |
| 098 | grammar | „kao kroz tihi i neopiranje hodnik” → „kao kroz tihi hodnik bez otpora” |
| 099 | grammar | „brzo nametnula kao gospodari pomorskog dela” → „brzo nametnula kao gospodar pomorskog dela” |
| 099 | orthography | „ne samo iz Moravske doline” → „ne samo iz moravske doline” |
| 099 | grammar | „Treba odmah reći šta ovaj period jeste, a šta nije bio.” → „Treba odmah reći šta je ovaj period bio, a šta nije.” |
| 100 | orthography | „Iz Bosne se, pak, na hum i deo” → „Iz Bosne se, pak, na Hum i deo” |
| 100 | grammar | „Da li bi celovita Dušan-skala država odolela” → „Da li bi celovita država Dušanovih razmera odolela” |
| 101 | grammar | „na jug Makedonije izrasla je” → „na jugu Makedonije izrasla je” |
| 102 | grammar | „uređene vojske, pisarne kancelarije i jasne strategije” → „uređene vojske, kancelarije i jasne strategije” |
| 102 | grammar | „nepripremljen na noćni napad” → „nepripremljen za noćni napad” |
| 103 | orthography | „Sveti Stefan Dečanski, sveti car Uroš” → „Sveti Stefan Dečanski, Sveti car Uroš” |
| 104 | grammar | „trgovački sporazumi sa Dubrovnikom” → „trgovačke sporazume sa Dubrovnikom” |
| 105 | orthography | „Samostalna srpska Arhiepiskopija” → „Samostalna srpska arhiepiskopija” |
| 105 | grammar | „u manastirskim skriptorijama” → „u manastirskim skriptorijima” |

## Suspected facts (not changed)
- 049: „Na zapadu su bili Ugarska i jadranski gradovi, na severu mađarska kruna” — puts Hungary both west and north; the geography looks off.
- 054: „upoznajući isihastičku tradiciju” (1190s) — hesychasm as a named tradition is a 14th-century movement, so this looks anachronistic.
- 060: „Nikeju i Carigrad obići će tek na povratku” (1234–36) — Constantinople was Latin-held then, so Sava's route through it needs checking.
- 061: „Vladislav je godinama posle, izgleda 1237” — „years later” contradicts the year given (one year after Sava's death in 1235/36).
- 063: „Pred kraj veka ... otvoriće se i Novo Brdo” — 083 dates its first mentions to 1319/1326. The same lesson has Brskovo „otvoreno još u prvoj polovini 13. veka” while the Saxons arrive mid-century (first mention 1254).
- 063: Venetians accused Serbian dinars „zbog konkurencije” — the usual account is imitation/counterfeiting of the grosso.
- 063: „šaht”, „hutman”, „cech” given as medieval Saxon loanwords — šaht is likely a later German loan; „cech” is not a Serbian form (ceh).
- 065: „kraljevina Srema ... središte ležalo između Save i Dunava” — Dragutin's core lands (Mačva, Debrc, Beograd, Usora) lay mostly south of the Sava.
- 066 vs 079: Dragutin's fall from his horse is placed „prilikom putovanja kod Jeleča” in 066 and „u lovu” in 079.
- 067: Milutin's detachments „borili uz cara protiv te neobuzdane sile” (Catalan Company) — the 1312 Serbian force fought the Turks allied with the Catalans at Gallipoli.
- 070: „dostojan očevog banjskog i dedinog studeničkog kruga” — Stefan Dečanski's grandfather is Uroš I (Sopoćani); Studenica is Nemanja's.
- 075: „Srpska crkva je još uvek bila arhiepiskopija, podređena Vaseljenskoj patrijaršiji” — contradicts the 1219 autocephaly (057/058).
- 052 vs 097: Nemanja's tonsure is in Ras (Sts Peter and Paul) in 052/053 but „u Studenici primio monaški postrig” in 097.
- 090: Jelena got her appanage „posle muževljeve smrti” — 064 ties it to Uroš's 1276 deposition (he died in 1277). Minor.
- 095: Beograd „kontrolisala donji Dunav” — it is on the middle Danube.

## Lessons that read weak
- 063 (Sasi): several garbled phrases (now fixed) and the most factual soft spots in the range (see above).
- 098 / 099 / 100: three consecutive lessons retell the same 1355–1371 breakdown with heavily overlapping facts and phrasing.
- 068 / 069 / 088: Gračanica, Ljeviška, Astrapa and Evtihije are described three times in nearly the same terms.
- 093 / 094 / 095: the Milutin marriage list and the 1299 peace repeat 066/067 almost verbatim.
- 091 (Food and dress): leans mostly on later ethnography; it says so openly, but it is thin on medieval sources.
