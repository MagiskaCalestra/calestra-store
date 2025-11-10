import Database from 'better-sqlite3';
const db = new Database('./calestra.db');

db.exec(`
INSERT INTO products (slug, title, price, currency, image_url, active)
SELECT 'founders-tee','Founder’s Tee',29900,'SEK','/images/tshirt-1.jpg',1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='founders-tee');

INSERT INTO products (slug, title, price, currency, image_url, active)
SELECT 'founders-poster','Founder’s Poster',14900,'SEK','/images/tote-1.jpg',1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='founders-poster');
`);

console.log('Products:', db.prepare('SELECT id,slug,title,price,currency,image_url FROM products').all());
