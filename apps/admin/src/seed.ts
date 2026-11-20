// One-off: fill the CMS with the current (dummy) site content. Run: pnpm --filter admin seed
// Skips if the Settings global already has a logo, so it never overwrites edits made in the admin.
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import config from './payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const img = (f: string) => path.resolve(dirname, '../../web/public/img', f)

const payload = await getPayload({ config })

const existing = await payload.findGlobal({ slug: 'beallitasok' })
if (existing.logo) {
  // content exists: only fill the form builder if it is still empty (migration from the fixed form)
  const form = await payload.findGlobal({ slug: 'urlap' })
  if (!form.groups?.length) {
    const chart = await payload.find({ collection: 'media', where: { alt: { equals: 'Póló és pulóver mérettáblázat' } }, limit: 1 })
    await payload.updateGlobal({ slug: 'urlap', data: { groups: defaultGroups(chart.docs[0]?.id, existing.privacyUrl) } })
    payload.logger.info('Form fields migrated.')
  } else payload.logger.info('Seed skipped: content already exists.')
  process.exit(0)
}

const upload = async (file: string, alt: string) =>
  (await payload.create({ collection: 'media', data: { alt }, filePath: img(file) })).id

const logo = await upload('bb-logo-white.svg', 'BB Hockey Skills logó')
const hero = await upload('tabor-hero.jpg', 'Edzés a BB Skills táborban')
const a = await upload('tabor-a.jpg', 'Jeges edzés')
const b = await upload('tabor-b.jpg', 'Off-ice edzés')
const c = await upload('tabor-c.jpg', 'Táborozók a jégen')
const sizeChart = await upload('meretek.png', 'Póló és pulóver mérettáblázat')

await payload.updateGlobal({
  slug: 'beallitasok',
  data: {
    logo,
    accent: '#f4eb06',
    accentLight: '#fff35c',
    accentDark: '#857f00',
    name: 'BB Your Hockey Skills',
    phone: '+36 30 000 0000',
    email: 'info@example.com',
    location: 'Győr, Audi Aréna (dummy)',
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    nav: [
      { label: 'Főoldal', target: 'fooldal' },
      { label: 'Táborról', target: 'taborrol' },
      { label: 'Rólunk', target: 'rolunk' },
      { label: 'Kapcsolat', target: 'kapcsolat' },
      { label: 'GYIK', target: 'gyik' },
    ],
    ctaLabel: 'Jelentkezés',
    quickTabLabel: 'Jelentkezés',
    mobileCallLabel: 'Hívás',
    footerText: 'Jégkorong utánpótlás-fejlesztés és nyári skills táborok 2015 óta.',
    footerColumnTitle: 'Tábor',
    footerLinks: [
      { label: 'Jelentkezés', target: 'jelentkezes' },
      { label: 'Napirend', target: 'napirend' },
      { label: 'Étlap', target: 'etlap' },
      { label: 'Árak és fizetés', target: 'gyik' },
    ],
    copyright: '© 2026 BB Your Hockey Skills. Minden jog fenntartva.',
    privacyUrl: '',
    siteTitle: 'BB Hockey Skills | Tábor jelentkezés',
    description: 'BB Skills nyári jégkorongtábor U8–U18 játékosoknak, nemzetközi edzőkkel. Jelentkezz online.',
    ogImage: hero,
    cookieShow: true,
    cookieTitle: 'Sütiket használunk',
    cookieText: 'A weboldal működéséhez szükséges sütiket minden esetben használjuk. A statisztikai sütikhez a hozzájárulásodat kérjük.',
    cookieAccept: 'Elfogadom',
    cookieNecessary: 'Csak a szükségesek',
  },
})

await payload.updateGlobal({
  slug: 'fooldal',
  data: {
    hero: {
      title: 'Fejleszd a',
      highlight: 'skilleidet.',
      text: 'BB Skills nyári jégkorongtábor U8–U18 játékosoknak, svéd és finn módszertannal, nemzetközi edzőkkel.',
      image: hero,
      primary: { label: 'Jelentkezem', href: '#jelentkezes' },
      secondary: { label: 'A táborról', href: '#taborrol' },
      stats: [
        { value: '10+', unit: 'év', label: 'tábor 2015 óta' },
        { value: '1000+', unit: 'résztvevő', label: 'az elmúlt években' },
        { value: '7', unit: 'ország', label: 'játékosok és edzők' },
        { value: 'SHL', unit: '& NLA', label: 'tapasztalatú edzők' },
      ],
    },
    marquee: { show: true, words: ['Korcsolyázás', 'Ütőkezelés', 'Lövés', 'Passz', 'Kapusedzés', 'Off-ice', 'Játékszituációk', 'Közösség'] },
    tabor: {
      show: true,
      title: 'A',
      highlight: 'táborról',
      subtitle: 'Egyhetes, bentlakásos tábor: 2027. június 21–25. · Győr, Audi Aréna jégcsarnok (dummy adat)',
      tiles: [
        { title: 'Jégen', text: 'Korcsolyázás, ütőkezelés, lövés és passz: napi két jeges edzés kis csoportokban.', image: a, cta: 'Jelentkezem' },
        { title: 'Off-ice', text: 'Koordináció, gyorsaság és erőnlét a jégen kívül, korosztályra szabva.', image: b, cta: 'Jelentkezem' },
        { title: 'Közösség', text: 'Csapatépítő programok, közös étkezések és új barátok több országból.', image: c, cta: 'Jelentkezem' },
      ],
    },
    napirend: {
      show: true,
      title: 'Így telik',
      highlight: 'egy nap',
      subtitle: 'Két jeges edzés, egy off-ice blokk és sok pihenő.',
      items: [
        { time: '08:00', title: 'Reggeli és bemelegítés', text: 'Közös reggeli, majd mobilizáló gyakorlatok.' },
        { time: '09:30', title: '1. jeges edzés', text: 'Korcsolyatechnika és ütőkezelés kis csoportokban.' },
        { time: '14:00', title: 'Off-ice blokk', text: 'Koordináció, gyorsaság, játékos erőnléti feladatok.' },
        { time: '16:30', title: '2. jeges edzés', text: 'Lövés, passz és játékszituációk, a nap zárásaként.' },
      ],
    },
    eszkozok: { show: false, title: 'A nap', highlight: 'képekben' },
    etlap: {
      show: true,
      title: 'Heti',
      highlight: 'étlap',
      subtitle: 'Minden nap leves és két főétel közül lehet választani. Ételallergiát és speciális igényt a jelentkezésnél jelezz.',
      days: [
        { day: 'Hétfő', date: '2027.06.21.', soup: 'Hideg eperkrémleves', a: 'Bolognai spagetti', b: 'Rántott csirkemell jázmin rizzsel' },
        { day: 'Kedd', date: '2027.06.22.', soup: 'Húsleves cérnametélttel', a: 'Csirke gyrostál', b: 'Tarhonyás hús' },
        { day: 'Szerda', date: '2027.06.23.', soup: 'Zöldségleves', a: 'Borsófőzelék fasírozottal', b: 'Cordon bleu jázmin rizzsel' },
        { day: 'Csütörtök', date: '2027.06.24.', soup: 'Kolbászos burgonyaleves', a: 'Brassói aprópecsenye sült burgonyával', b: 'Pankós bundában sült csirkefalatok jázmin rizzsel' },
        { day: 'Péntek', date: '2027.06.25.', soup: 'Zöldborsóleves', a: 'Csirkepörkölt galuskával', b: 'Sajtbundában sült csirkemell jázmin rizzsel' },
      ],
    },
    rolunk: {
      show: true,
      title: 'Két testvér,',
      highlight: 'egy szenvedély',
      text:
        'A BB Your Hockey Skills-t Bartalis Balázs és Bartalis István alapította 2015-ben. A célunk az utánpótlás-játékosok egyéni fejlesztése azzal a tudással és rutinnal, amit Svédországban és Finnországban szereztünk.\n\n2020 óta minden évben szervezünk tábort, eddig több mint 1000 résztvevővel Magyarországról, Romániából, Szlovákiából, Svédországból és más országokból.',
      image: c,
      coaches: [
        { name: 'Bartalis Balázs', role: 'Vezetőedző · skills coach', text: 'Vierumäki edzőképzés, SHL és NLA bajnoki címek skills edzőként.' },
        { name: 'Bartalis István', role: 'Szervező · edző', text: 'A tábor alapítója, 2015 óta szervezi a BB Skills programokat.' },
      ],
    },
    velemenyek: {
      show: true,
      title: 'Akik már',
      highlight: 'velünk voltak',
      items: [
        { name: 'Nagy Katalin', who: 'U12-es játékos szülője', quote: 'A fiam teljesen új lendülettel jött haza. Egy hét alatt látványosat fejlődött a korcsolyázása.' },
        { name: 'Tóth Gábor', who: 'U14-es játékos szülője', quote: 'Profi szervezés, figyelmes edzők. Jövőre is jövünk.' },
        { name: 'Szabó Márk', who: 'U16 játékos', quote: 'Itt tanultam meg igazán lőni. Az edzők mindenkivel külön foglalkoznak.' },
      ],
    },
    gyik: {
      show: true,
      title: 'Gyakori',
      highlight: 'kérdések',
      items: [
        { q: 'Hány éves kortól lehet jelentkezni?', a: 'U8-tól U18-ig várunk játékosokat. A csoportokat korosztály és tudásszint szerint alakítjuk ki.' },
        { q: 'Mit kell hozni a táborba?', a: 'Teljes jégkorong felszerelést, edzőruhát az off-ice blokkokhoz, kulacsot és váltóruhát. A tábori pólót és zoknit mi adjuk.' },
        { q: 'Mennyibe kerül a tábor?', a: 'Egyéni jelentkezés 160 000 Ft / fő, testvéreknek 140 000 Ft / fő. Az ár tartalmazza az edzéseket, az étkezést és a tábori felszerelést.' },
        { q: 'Hogyan fizethetek?', a: 'A jelentkezés után e-mailben küldjük a díjbekérőt, átutalással lehet fizetni.' },
        { q: 'Kapusoknak is van program?', a: 'Igen, a kapusok külön kapusedzővel dolgoznak a jeges edzések egy részében.' },
        { q: 'Mi történik, ha lemondjuk a részvételt?', a: 'A tábor kezdete előtt 30 nappal díjmentesen lemondható, utána a részvételi feltételek szerint térítünk vissza.' },
      ],
    },
    kapcsolat: {
      show: true,
      title: 'Kérdésed van?\nÍrj nekünk.',
      text: 'Szívesen segítünk a jelentkezésben, a csoportbeosztásban vagy bármi másban.',
      cardTitle: 'BB Your Hockey Skills',
      rows: [
        { label: 'Helyszín', value: 'Győr, Audi Aréna (dummy)' },
        { label: 'Telefon', value: '+36 30 000 0000' },
        { label: 'E-mail', value: 'info@example.com' },
        { label: 'Időpont', value: '2027. június 21–25.' },
      ],
      button: { label: 'Jelentkezem', href: '#jelentkezes' },
    },
  },
})

await payload.updateGlobal({
  slug: 'urlap',
  data: {
    open: true,
    title: 'BB Skills tábor',
    highlight: 'jelentkezés',
    intro: 'Add meg a szülő és a játékos adatait, a ruhaméreteket, az egészségügyi információkat, majd fogadd el a feltételeket és küldd el a jelentkezést.',
    submitLabel: 'Jelentkezés elküldése',
    successMessage: 'Köszönjük, megkaptuk a jelentkezést! Hamarosan e-mailben jelentkezünk.',
    groups: defaultGroups(sizeChart, null),
  },
})

payload.logger.info('Seed done.')
process.exit(0)

type F = { label: string; type?: string; name?: string; width?: 'half' | 'full'; required?: boolean; options?: string[]; placeholder?: string; help?: string; link?: string | null; image?: string | number; ifField?: string; ifValue?: string }
function defaultGroups(sizeChart: string | number | undefined, privacyUrl: string | null | undefined) {
  const f = (name: string, label: string, extra: Partial<F> = {}): F => ({ name, label, type: 'text', width: 'half', required: true, ...extra })
  const full = { width: 'full' as const }
  const yesNo = ['Nem', 'Igen']
  const ceg = { required: false, ifField: 'szamla_tipus', ifValue: 'Cég' }
  return [
    { title: 'Jelentkezés', fields: [
      f('jelentkezes', 'Jelentkezés típusa', { type: 'radio', ...full, options: ['Egyedül jelentkezem – 160 000 Ft / fő', 'Testvéremmel jelentkezem – 140 000 Ft / fő'], help: 'Testvéres jelentkezésnél a második gyermeket egy új jelentkezéssel tudod regisztrálni.' }),
    ] },
    { title: 'Szülő / kapcsolattartó adatai', fields: [
      f('szulo_vezeteknev', 'Szülő / gondviselő – vezetéknév'),
      f('szulo_keresztnev', 'Szülő / gondviselő – keresztnév'),
      f('email', 'E-mail cím', { type: 'email', placeholder: 'pelda@pelda.hu' }),
      f('telefon', 'Telefonszám', { type: 'tel', placeholder: '+36 30 123 4567' }),
      f('szamlazasi_vezeteknev', 'Számlázási név – vezetéknév'),
      f('szamlazasi_keresztnev', 'Számlázási név – keresztnév'),
      f('szamla_iranyitoszam', 'Irányítószám'),
      f('szamla_varos', 'Város'),
      f('szamla_utca', 'Utca, házszám', full),
      f('szamla_orszag', 'Ország', { placeholder: 'Magyarország' }),
      f('szamla_tipus', 'Milyen számlát kérsz?', { type: 'radio', ...full, options: ['Magánszemély', 'Cég'] }),
      f('cegnev', 'Cégnév', ceg),
      f('adoszam', 'Adószám', ceg),
      f('szekhely', 'Székhely (cím)', { ...ceg, ...full }),
    ] },
    { title: 'Játékos adatai', fields: [
      f('jatekos_vezeteknev', 'Játékos – vezetéknév'),
      f('jatekos_keresztnev', 'Játékos – keresztnév'),
      f('szuletesi_datum', 'Születési dátum', { type: 'date' }),
      f('klub', 'Klub / csapat neve'),
      f('korosztaly', 'Korosztály', { type: 'select', options: ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Egyéb'] }),
      f('poszt', 'Poszt', { type: 'select', options: ['Kapus', 'Védő', 'Csatár'] }),
      f('uto_fogas', 'Ütő fogás', { type: 'select', options: ['Bal', 'Jobb'] }),
      f('tapasztalat', 'Mióta jégkorongozik?', { type: 'select', options: ['1–2 év', '3–5 év', '6–8 év', '9+ év'] }),
    ] },
    { title: 'Ruhaméretek', fields: [
      ...(sizeChart ? [f('meret_tablazat', 'Mérettáblázat', { type: 'image', ...full, required: false, image: sizeChart })] : []),
      f('polomeret', 'Pólóméret / pulóver', { type: 'radio', ...full, options: ['98-104', '110-116', '122-128', '134-146', '152-158', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] }),
      f('zokni', 'Zokniméret', { type: 'select', options: ['27–30', '31–34', '35–38', '39–42', '43–46'] }),
    ] },
    { title: 'Étkezés / egészségügyi információ', fields: [
      f('allergia', 'Van-e a gyermeknek allergiája?', { type: 'radio', ...full, options: yesNo }),
      f('allergia_reszletek', 'Mire allergiás?', { ...full, required: false, ifField: 'allergia', ifValue: 'Igen' }),
      f('etelintolerancia', 'Van-e a gyermeknek ételintoleranciája?', { type: 'radio', ...full, required: false, options: yesNo }),
      f('etkezes', 'Speciális étkezési igények', { type: 'checkboxes', ...full, required: false, options: ['Nincs', 'Laktózmentes', 'Gluténmentes', 'Vegetáriánus', 'Egyéb'] }),
      f('egeszsegugyi_info', 'Egyéb fontos egészségügyi vagy orvosi információ', { type: 'textarea', ...full, required: false, ifField: 'etkezes', ifValue: 'Egyéb' }),
    ] },
    { title: 'Vészhelyzeti kapcsolattartó', fields: [
      f('veszhelyzeti_vezeteknev', 'Kapcsolattartó – vezetéknév'),
      f('veszhelyzeti_keresztnev', 'Kapcsolattartó – keresztnév'),
      f('veszhelyzeti_kapcsolat', 'Kapcsolat a gyermekkel', { type: 'select', options: ['Anya', 'Apa', 'Gondviselő', 'Egyéb'] }),
      f('veszhelyzeti_telefon', 'Telefonszám', { type: 'tel', placeholder: '+36 30 123 4567' }),
    ] },
    { title: 'Nyilatkozatok', fields: [
      f('feltetelek', 'Elfogadom a BB Skills Camp részvételi feltételeit', { type: 'consent', ...full }),
      f('adatkezeles', 'Elfogadom az adatkezelési tájékoztatót és adatvédelmi nyilatkozatot', { type: 'consent', ...full, link: privacyUrl }),
      f('szuloi_hozzajarulas', 'Szülőként / törvényes képviselőként hozzájárulok a gyermek részvételéhez', { type: 'consent', ...full }),
      f('foto_hozzajarulas', 'Hozzájárulok fénykép- és videófelvételek készítéséhez, valamint azok BB Skills marketing- és közösségi média célú felhasználásához', { type: 'consent', ...full, required: false }),
    ] },
  ]
}
