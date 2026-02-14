'use strict';

// Entry point untuk cPanel Node.js App (Passenger)
// File ini digunakan sebagai Application Startup File di cPanel

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).register();
  await app.start();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
