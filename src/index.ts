import type { Core } from '@strapi/strapi';
import { invalidateApiCache } from './lib/redis';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * Seeds initial data (categories, authors, articles, products)
   * on first run only.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Check if already seeded
    const categoryCount = await strapi.db
      .query('api::category.category')
      .count();

    if (categoryCount > 0) {
      console.log('📦 Seed data already exists, skipping...');
    } else {

    console.log('🌱 Seeding initial data...');

    try {
      // =====================================================
      // 1. Create Categories
      // =====================================================
      const categories = await Promise.all([
        strapi.db.query('api::category.category').create({
          data: {
            name: 'Sains & Teknologi',
            slug: 'sains-teknologi',
            description:
              'Artikel seputar sains, teknologi, dan penemuan ilmiah untuk anak-anak.',
          },
        }),
        strapi.db.query('api::category.category').create({
          data: {
            name: 'Parenting Islami',
            slug: 'parenting-islami',
            description:
              'Tips dan panduan mendidik anak sesuai nilai-nilai Islam.',
          },
        }),
        strapi.db.query('api::category.category').create({
          data: {
            name: 'Produk Edukasi',
            slug: 'produk-edukasi',
            description:
              'Informasi dan review produk edukasi untuk perkembangan anak.',
          },
        }),
      ]);

      const [catSains, catParenting, catProduk] = categories;
      console.log(`  ✅ ${categories.length} categories created`);

      // =====================================================
      // 2. Create Authors
      // =====================================================
      const authors = await Promise.all([
        strapi.db.query('api::author.author').create({
          data: {
            name: 'Admin InShan',
            slug: 'admin-inshan',
            bio: 'Tim pengelola konten InShan Media. Menyajikan artikel sains dan edukasi untuk keluarga Indonesia.',
            email: 'admin@inshanmedia.com',
          },
        }),
        strapi.db.query('api::author.author').create({
          data: {
            name: 'Tim Redaksi',
            slug: 'tim-redaksi',
            bio: 'Tim redaksi InShan Media yang fokus pada konten parenting dan pendidikan anak.',
            email: 'redaksi@inshanmedia.com',
          },
        }),
      ]);

      const [authorAdmin, authorRedaksi] = authors;
      console.log(`  ✅ ${authors.length} authors created`);

      // =====================================================
      // 3. Create Articles
      // =====================================================
      const articles = await Promise.all([
        strapi.db.query('api::article.article').create({
          data: {
            title: 'Mengenal Sains Alam untuk Anak',
            slug: 'mengenal-sains-alam-untuk-anak',
            excerpt:
              'Memperkenalkan konsep sains alam kepada anak-anak melalui eksperimen sederhana dan pengamatan lingkungan sekitar.',
            content: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Sains alam adalah salah satu cara terbaik untuk mengajarkan anak-anak tentang dunia di sekitar mereka. Melalui eksperimen sederhana dan pengamatan, anak-anak dapat memahami konsep-konsep dasar seperti gravitasi, cahaya, dan siklus air.',
                  },
                ],
              },
              {
                type: 'heading',
                level: 2,
                children: [
                  {
                    type: 'text',
                    text: 'Mengapa Sains Penting untuk Anak?',
                  },
                ],
              },
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Pembelajaran sains sejak dini membantu mengembangkan kemampuan berpikir kritis, rasa ingin tahu, dan keterampilan pemecahan masalah yang akan berguna sepanjang hidup mereka.',
                  },
                ],
              },
            ],
            status: 'published',
            views: 0,
            author: authorAdmin.id,
            categories: [catSains.id],
            publishedAt: new Date().toISOString(),
          },
        }),
        strapi.db.query('api::article.article').create({
          data: {
            title: 'Tips Mendidik Anak dengan Kasih Sayang',
            slug: 'tips-mendidik-anak-dengan-kasih-sayang',
            excerpt:
              'Panduan praktis mendidik anak dengan penuh kasih sayang sesuai ajaran Islam dan perkembangan psikologi modern.',
            content: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Mendidik anak dengan kasih sayang bukan berarti memanjakan mereka tanpa batas. Dalam Islam, mendidik anak adalah amanah yang harus dilakukan dengan bijaksana, penuh cinta, dan konsisten.',
                  },
                ],
              },
              {
                type: 'heading',
                level: 2,
                children: [
                  {
                    type: 'text',
                    text: 'Prinsip Dasar Parenting Islami',
                  },
                ],
              },
              {
                type: 'list',
                format: 'ordered',
                children: [
                  {
                    type: 'list-item',
                    children: [
                      {
                        type: 'text',
                        text: 'Berikan teladan yang baik dalam perilaku sehari-hari',
                      },
                    ],
                  },
                  {
                    type: 'list-item',
                    children: [
                      {
                        type: 'text',
                        text: 'Ajarkan doa dan ibadah sejak dini dengan cara yang menyenangkan',
                      },
                    ],
                  },
                  {
                    type: 'list-item',
                    children: [
                      {
                        type: 'text',
                        text: 'Dengarkan dan hargai pendapat anak',
                      },
                    ],
                  },
                ],
              },
            ],
            status: 'published',
            views: 0,
            author: authorRedaksi.id,
            categories: [catParenting.id],
            publishedAt: new Date().toISOString(),
          },
        }),
        strapi.db.query('api::article.article').create({
          data: {
            title: 'Pentingnya Literasi Digital untuk Generasi Muda',
            slug: 'pentingnya-literasi-digital-untuk-generasi-muda',
            excerpt:
              'Di era digital, anak-anak perlu dibekali kemampuan literasi digital agar bisa memanfaatkan teknologi secara bijak dan aman.',
            content: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Literasi digital bukan hanya tentang kemampuan menggunakan gadget, tetapi juga tentang memahami cara kerja teknologi, berpikir kritis terhadap informasi online, dan menjaga keamanan diri di dunia maya.',
                  },
                ],
              },
              {
                type: 'heading',
                level: 2,
                children: [
                  {
                    type: 'text',
                    text: 'Apa yang Perlu Diajarkan?',
                  },
                ],
              },
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Orang tua perlu mengajarkan anak tentang etika digital, cara membedakan informasi benar dan hoaks, serta pentingnya menjaga privasi di internet.',
                  },
                ],
              },
            ],
            status: 'published',
            views: 0,
            author: authorAdmin.id,
            categories: [catSains.id],
            publishedAt: new Date().toISOString(),
          },
        }),
      ]);

      console.log(`  ✅ ${articles.length} articles created`);

      // =====================================================
      // 4. Create Products
      // =====================================================
      const products = await Promise.all([
        strapi.db.query('api::product.product').create({
          data: {
            name: 'Buku Sains Anak: Dunia Hewan',
            slug: 'buku-sains-anak-dunia-hewan',
            description: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Buku ilustrasi penuh warna yang mengenalkan dunia hewan kepada anak-anak usia 5-10 tahun. Dilengkapi fakta menarik dan aktivitas seru.',
                  },
                ],
              },
            ],
            price: 85000,
            sku: 'ISM-BK-001',
            stock_quantity: 50,
            weight: 250,
            dimensions: { length: 25, width: 20, height: 1 },
            brand: 'InShan Media',
            tags: ['buku', 'sains', 'anak', 'hewan', 'edukasi'],
            is_active: true,
            categories: [catSains.id, catProduk.id],
            publishedAt: new Date().toISOString(),
          },
        }),
        strapi.db.query('api::product.product').create({
          data: {
            name: 'Poster Edukatif Sistem Tata Surya',
            slug: 'poster-edukatif-sistem-tata-surya',
            description: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Poster ukuran besar (A1) dengan ilustrasi tata surya yang detail dan informatif. Cocok untuk ditempel di kamar anak atau ruang belajar.',
                  },
                ],
              },
            ],
            price: 45000,
            sku: 'ISM-PS-001',
            stock_quantity: 100,
            weight: 100,
            dimensions: { length: 84, width: 59, height: 0.1 },
            brand: 'InShan Media',
            tags: ['poster', 'sains', 'tata-surya', 'edukasi'],
            is_active: true,
            categories: [catSains.id, catProduk.id],
            publishedAt: new Date().toISOString(),
          },
        }),
        strapi.db.query('api::product.product').create({
          data: {
            name: 'Flashcard Huruf Hijaiyah',
            slug: 'flashcard-huruf-hijaiyah',
            description: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Set flashcard 30 kartu huruf Hijaiyah dengan gambar ilustrasi menarik. Membantu anak belajar membaca Al-Quran dengan cara yang menyenangkan.',
                  },
                ],
              },
            ],
            price: 65000,
            sale_price: 55000,
            sku: 'ISM-FC-001',
            stock_quantity: 75,
            weight: 150,
            dimensions: { length: 10, width: 7, height: 3 },
            brand: 'InShan Media',
            tags: ['flashcard', 'hijaiyah', 'islam', 'anak', 'edukasi'],
            is_active: true,
            categories: [catParenting.id, catProduk.id],
            publishedAt: new Date().toISOString(),
          },
        }),
        strapi.db.query('api::product.product').create({
          data: {
            name: 'Puzzle Peta Indonesia',
            slug: 'puzzle-peta-indonesia',
            description: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Puzzle kayu 100 keping berbentuk peta Indonesia. Mengajarkan anak tentang geografi nusantara sambil bermain. Bahan kayu berkualitas dan cat aman untuk anak.',
                  },
                ],
              },
            ],
            price: 120000,
            sku: 'ISM-PZ-001',
            stock_quantity: 30,
            weight: 500,
            dimensions: { length: 30, width: 20, height: 4 },
            brand: 'InShan Media',
            tags: ['puzzle', 'geografi', 'indonesia', 'anak', 'edukasi'],
            is_active: true,
            categories: [catProduk.id],
            publishedAt: new Date().toISOString(),
          },
        }),
      ]);

      console.log(`  ✅ ${products.length} products created`);
      console.log('🎉 Seed data created successfully!');
    } catch (error) {
      console.error('❌ Seed error:', error);
    }
    }

    // Cache invalidation lifecycle hooks
    strapi.db.lifecycles.subscribe({
      models: [
        'api::article.article',
        'api::product.product',
        'api::category.category',
        'api::author.author',
      ],
      async afterCreate() { await invalidateApiCache(); },
      async afterCreateMany() { await invalidateApiCache(); },
      async afterUpdate() { await invalidateApiCache(); },
      async afterUpdateMany() { await invalidateApiCache(); },
      async afterDelete() { await invalidateApiCache(); },
      async afterDeleteMany() { await invalidateApiCache(); },
    });
  },
};
