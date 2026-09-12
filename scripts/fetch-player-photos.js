// fetch-player-photos.js
// Récupère la photo principale (infobox) de chaque nom via l'API Wikipedia,
// puis l'auteur + la licence exacte via l'API Wikimedia Commons.
// Aucune clé API nécessaire. Node 18+ requis (fetch natif).
//
// Usage : node fetch-player-photos.js

const fs = require('fs');
const path = require('path');

// Liste prête à l'emploi : ~70 footballeurs français (actuels + légendes +
// équipe féminine) et ~60 rappeurs français. Ajoute/retire des lignes selon
// tes besoins — le script fonctionne avec n'importe quelle taille de liste.
const NAMES = [
  // --- Football français ---
  { name: 'Zinedine Zidane', category: 'foot_fr' },
  { name: 'Kylian Mbappé', category: 'foot_fr' },
  { name: 'Antoine Griezmann', category: 'foot_fr' },
  { name: 'Karim Benzema', category: 'foot_fr' },
  { name: 'Paul Pogba', category: 'foot_fr' },
  { name: "N'Golo Kanté", category: 'foot_fr' },
  { name: 'Didier Deschamps', category: 'foot_fr' },
  { name: 'Hugo Lloris', category: 'foot_fr' },
  { name: 'Michel Platini', category: 'foot_fr' },
  { name: 'Just Fontaine', category: 'foot_fr' },
  { name: 'Thierry Henry', category: 'foot_fr' },
  { name: 'Franck Ribéry', category: 'foot_fr' },
  { name: 'Olivier Giroud', category: 'foot_fr' },
  { name: 'Ousmane Dembélé', category: 'foot_fr' },
  { name: 'Kingsley Coman', category: 'foot_fr' },
  { name: 'Aurélien Tchouaméni', category: 'foot_fr' },
  { name: 'Eduardo Camavinga', category: 'foot_fr' },
  { name: 'Lucas Hernandez', category: 'foot_fr' },
  { name: 'Raphaël Varane', category: 'foot_fr' },
  { name: 'Presnel Kimpembe', category: 'foot_fr' },
  { name: 'Adrien Rabiot', category: 'foot_fr' },
  { name: 'Marcus Thuram', category: 'foot_fr' },
  { name: 'Randal Kolo Muani', category: 'foot_fr' },
  { name: 'Wissam Ben Yedder', category: 'foot_fr' },
  { name: 'Mike Maignan', category: 'foot_fr' },
  { name: 'Théo Hernandez', category: 'foot_fr' },
  { name: 'Jules Koundé', category: 'foot_fr' },
  { name: 'William Saliba', category: 'foot_fr' },
  { name: 'Christopher Nkunku', category: 'foot_fr' },
  { name: 'Moussa Diaby', category: 'foot_fr' },
  { name: 'Bradley Barcola', category: 'foot_fr' },
  { name: 'Warren Zaïre-Emery', category: 'foot_fr' },
  { name: 'Youssouf Fofana', category: 'foot_fr' },
  { name: 'Dayot Upamecano', category: 'foot_fr' },
  { name: 'Ibrahima Konaté', category: 'foot_fr' },
  { name: 'Benjamin Pavard', category: 'foot_fr' },
  { name: 'Steve Mandanda', category: 'foot_fr' },
  { name: 'Laurent Blanc', category: 'foot_fr' },
  { name: 'Marcel Desailly', category: 'foot_fr' },
  { name: 'Lilian Thuram', category: 'foot_fr' },
  { name: 'Youri Djorkaeff', category: 'foot_fr' },
  { name: 'Patrick Vieira', category: 'foot_fr' },
  { name: 'Bixente Lizarazu', category: 'foot_fr' },
  { name: 'Fabien Barthez', category: 'foot_fr' },
  { name: 'Emmanuel Petit', category: 'foot_fr' },
  { name: 'Robert Pirès', category: 'foot_fr' },
  { name: 'David Trezeguet', category: 'foot_fr' },
  { name: 'Sylvain Wiltord', category: 'foot_fr' },
  { name: 'Nicolas Anelka', category: 'foot_fr' },
  { name: 'Eric Cantona', category: 'foot_fr' },
  { name: 'Jean-Pierre Papin', category: 'foot_fr' },
  { name: 'Raymond Kopa', category: 'foot_fr' },
  { name: 'Marius Trésor', category: 'foot_fr' },
  { name: 'Dominique Rocheteau', category: 'foot_fr' },
  { name: 'Alain Giresse', category: 'foot_fr' },
  { name: 'Luis Fernández', category: 'foot_fr' },
  { name: 'Jean Tigana', category: 'foot_fr' },
  { name: 'Wendie Renard', category: 'foot_fr' },
  { name: 'Eugénie Le Sommer', category: 'foot_fr' },
  { name: 'Amandine Henry', category: 'foot_fr' },
  { name: 'Kadidiatou Diani', category: 'foot_fr' },
  { name: 'Griedge Mbock', category: 'foot_fr' },
  { name: 'Delphine Cascarino', category: 'foot_fr' },
  { name: 'Sakina Karchaoui', category: 'foot_fr' },
  { name: 'Arsène Wenger', category: 'foot_fr' },

  // --- Rap français ---
  { name: 'Booba', category: 'rap_fr' },
  { name: 'Jul (rappeur)', category: 'rap_fr' },
  { name: 'Ninho (rappeur)', category: 'rap_fr' },
  { name: 'Nekfeu', category: 'rap_fr' },
  { name: 'Bigflo et Oli', category: 'rap_fr' },
  { name: 'Orelsan', category: 'rap_fr' },
  { name: 'Gims', category: 'rap_fr' },
  { name: 'Dadju', category: 'rap_fr' },
  { name: 'Soprano (rappeur)', category: 'rap_fr' },
  { name: 'Kaaris', category: 'rap_fr' },
  { name: 'Lacrim', category: 'rap_fr' },
  { name: 'Kalash Criminel', category: 'rap_fr' },
  { name: 'Alonzo (rappeur)', category: 'rap_fr' },
  { name: 'PLK (rappeur)', category: 'rap_fr' },
  { name: 'Naps (rappeur)', category: 'rap_fr' },
  { name: 'SCH (rappeur)', category: 'rap_fr' },
  { name: 'Damso', category: 'rap_fr' },
  { name: 'Vald (rappeur)', category: 'rap_fr' },
  { name: 'Freeze Corleone', category: 'rap_fr' },
  { name: 'Werenoi', category: 'rap_fr' },
  { name: 'Tiakola', category: 'rap_fr' },
  { name: 'Ziak', category: 'rap_fr' },
  { name: 'Gazo', category: 'rap_fr' },
  { name: 'Laylow', category: 'rap_fr' },
  { name: 'Hamza (rappeur)', category: 'rap_fr' },
  { name: 'Niska', category: 'rap_fr' },
  { name: 'Fababy', category: 'rap_fr' },
  { name: 'Sofiane', category: 'rap_fr' },
  { name: 'La Fouine', category: 'rap_fr' },
  { name: 'Rohff', category: 'rap_fr' },
  { name: 'Kery James', category: 'rap_fr' },
  { name: 'Youssoupha', category: 'rap_fr' },
  { name: 'Lino (rappeur)', category: 'rap_fr' },
  { name: 'Oxmo Puccino', category: 'rap_fr' },
  { name: 'MC Solaar', category: 'rap_fr' },
  { name: 'Akhenaton', category: 'rap_fr' },
  { name: "Shurik'n", category: 'rap_fr' },
  { name: "Diam's", category: 'rap_fr' },
  { name: 'Keny Arkana', category: 'rap_fr' },
  { name: 'Casey (rappeuse)', category: 'rap_fr' },
  { name: 'Georgio (rappeur)', category: 'rap_fr' },
  { name: 'Kekra', category: 'rap_fr' },
  { name: 'Alpha Wann', category: 'rap_fr' },
  { name: 'Lomepal', category: 'rap_fr' },
  { name: 'Roméo Elvis', category: 'rap_fr' },
  { name: 'Népal (rappeur)', category: 'rap_fr' },
  { name: 'Luidji', category: 'rap_fr' },
  { name: 'Zola (rappeur)', category: 'rap_fr' },
  { name: 'Koba LaD', category: 'rap_fr' },
  { name: 'Timal', category: 'rap_fr' },
  { name: 'Leto (rappeur)', category: 'rap_fr' },
  { name: 'RK (rappeur)', category: 'rap_fr' },
  { name: 'Guy2Bezbar', category: 'rap_fr' },
  { name: "Heuss l'Enfoiré", category: 'rap_fr' },
  { name: 'Naza', category: 'rap_fr' },
  { name: 'Aya Nakamura', category: 'rap_fr' },
  { name: 'Maes (rappeur)', category: 'rap_fr' },
  { name: 'Kalash (rappeur)', category: 'rap_fr' },
];

const OUT_DIR = path.join(__dirname, 'player-photos');
const WIKI_LANGS = ['fr', 'en']; // essaie le wiki FR d'abord, puis EN si rien trouvé
const UA = 'QuizzupPhotoFetcher/1.0 (usage interne, projet perso QuizzUp)';

async function getPageImage(name, lang) {
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&piprop=original&format=json&redirects=1`;
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const pages = data.query && data.query.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || !page.original) return null;
  return page.original.source;
}

async function getImageLicense(imageUrl) {
  const fileName = decodeURIComponent(imageUrl.split('/').pop());
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo&iiprop=extmetadata|url&format=json`;
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const pages = data.query && data.query.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const info = page && page.imageinfo && page.imageinfo[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  return {
    fileName,
    filePage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
    author: meta.Artist ? meta.Artist.value.replace(/<[^>]+>/g, '').trim() : 'Inconnu',
    license: meta.LicenseShortName ? meta.LicenseShortName.value : 'Inconnu',
    licenseUrl: meta.LicenseUrl ? meta.LicenseUrl.value : null,
  };
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const { name, category } of NAMES) {
    let imageUrl = null;
    for (const lang of WIKI_LANGS) {
      try { imageUrl = await getPageImage(name, lang); } catch { imageUrl = null; }
      if (imageUrl) break;
    }

    if (!imageUrl) {
      console.log(`❌ ${name} — aucune image trouvée`);
      manifest.push({ name, category, status: 'not_found' });
      continue;
    }

    let license = null;
    try { license = await getImageLicense(imageUrl); } catch { license = null; }

    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const safeName = name.replace(/[^a-z0-9]+/gi, '_');
    const destPath = path.join(OUT_DIR, `${safeName}${ext}`);

    try {
      await downloadImage(imageUrl, destPath);
      console.log(`✅ ${name} → ${path.basename(destPath)} (licence: ${license ? license.license : '?'})`);
    } catch {
      console.log(`⚠️  ${name} — échec du téléchargement`);
    }

    manifest.push({ name, category, status: 'ok', file: path.basename(destPath), imageUrl, ...license });

    await new Promise((r) => setTimeout(r, 300)); // pause polie envers l'API
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const ok = manifest.filter((m) => m.status === 'ok').length;
  console.log(`\nTerminé : ${ok}/${NAMES.length} photos récupérées dans ${OUT_DIR}/`);
  console.log('⚠️  Vérifie le champ "license" dans manifest.json avant intégration — écarte tout ce qui n\'est pas CC BY / CC BY-SA / Public domain.');
}

main();
