const fs = require('fs');

function replaceAllInFile(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(file, content, 'utf8');
}

const flag = '\uD83C\uDDE8\uD83C\uDDEC'; // 🇨🇬

// Header.tsx
replaceAllInFile('src/components/Header.tsx', '<span className="opacity-80">+242 05 545 70 46</span>', '<span className="opacity-80">' + flag + ' +242 05 545 70 46</span>');

// Footer.tsx
replaceAllInFile('src/components/Footer.tsx', 'Boutique lifestyle premium au Congo.', 'Boutique lifestyle premium au Congo Brazzaville ' + flag + '.');
replaceAllInFile('src/components/Footer.tsx', '<span>+242 05 545 70 46</span>', '<span>' + flag + ' +242 05 545 70 46</span>');
replaceAllInFile('src/components/Footer.tsx', '<span>Pointe-Noire, Congo</span>', '<span>Pointe-Noire, Congo Brazzaville ' + flag + '</span>');

// __root.tsx
replaceAllInFile('src/routes/__root.tsx', 'title: "ZANDO — Boutique Lifestyle premium au Congo"', 'title: "ZANDO — Boutique Lifestyle premium au Congo Brazzaville ' + flag + '"');
replaceAllInFile('src/routes/__root.tsx', 'content: "ZANDO — Boutique Lifestyle premium au Congo"', 'content: "ZANDO — Boutique Lifestyle premium au Congo Brazzaville ' + flag + '"');

// index.tsx
replaceAllInFile('src/routes/index.tsx', 'Boutique lifestyle premium au Congo.', 'Boutique lifestyle premium au Congo Brazzaville ' + flag + '.');
replaceAllInFile('src/routes/index.tsx', 'premium livrés rapidement au Congo.', 'premium livrés rapidement au Congo Brazzaville ' + flag + '.');
replaceAllInFile('src/routes/index.tsx', 'Brazzaville.\n            </p>', 'Brazzaville ' + flag + '.\n            </p>');

// checkout.tsx
replaceAllInFile('src/routes/checkout.tsx', 'placeholder="+242 …"', 'placeholder="' + flag + ' +242 …"');
replaceAllInFile('src/routes/checkout.tsx', "Besoin d'aide ? +242 05 545 70 46", "Besoin d'aide ? " + flag + " +242 05 545 70 46");

// compte.tsx
replaceAllInFile('src/routes/compte.tsx', 'placeholder="+242 …"', 'placeholder="' + flag + ' +242 …"');

console.log('Replacements completed successfully.');
