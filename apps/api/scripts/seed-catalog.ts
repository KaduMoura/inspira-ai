import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kassa';

const demoProducts = [
    {
        title: 'Sofá Minimalista Velvet',
        description: 'Sofá de 3 lugares com revestimento em veludo cinza, pés de madeira clara e design escandinavo.',
        category: 'Sala de Estar',
        type: 'Sofá',
        price: 2499.00,
        width: 210,
        height: 85,
        depth: 90
    },
    {
        title: 'Cadeira Eames Wood',
        description: 'Cadeira icônica com assento em polipropileno branco e base em madeira e metal.',
        category: 'Sala de Jantar',
        type: 'Cadeira',
        price: 189.90,
        width: 46,
        height: 82,
        depth: 53
    },
    {
        title: 'Mesa de Jantar Industrial Rio',
        description: 'Mesa retangular para 6 pessoas, tampo em madeira maciça e estrutura metálica preta.',
        category: 'Sala de Jantar',
        type: 'Mesa',
        price: 1250.00,
        width: 160,
        height: 75,
        depth: 90
    },
    {
        title: 'Poltrona Lounge Couro',
        description: 'Poltrona giratória revestida em couro legítimo marrom com base em alumínio.',
        category: 'Sala de Estar',
        type: 'Poltrona',
        price: 3200.00,
        width: 80,
        height: 95,
        depth: 85
    },
    {
        title: 'Estante de Livros Modular Branca',
        description: 'Estante com 5 prateleiras em MDF branco, ideal para escritórios ou salas de estar.',
        category: 'Escritório',
        type: 'Estante',
        price: 450.00,
        width: 80,
        height: 180,
        depth: 30
    },
    {
        title: 'Cama Queen Estofada Bege',
        description: 'Cama box queen size com cabeceira estofada em linho bege e estrutura reforçada.',
        category: 'Quarto',
        type: 'Cama',
        price: 1800.00,
        width: 158,
        height: 110,
        depth: 198
    },
    {
        title: 'Mesa de Centro Rústica Pinus',
        description: 'Mesa de centro baixa em madeira de pinus tratada com acabamento em verniz fosco.',
        category: 'Sala de Estar',
        type: 'Mesa de Centro',
        price: 320.00,
        width: 90,
        height: 35,
        depth: 60
    },
    {
        title: 'Cômoda de Quarto 4 Gavetas Preta',
        description: 'Cômoda moderna com puxadores embutidos e gavetas com corrediças telescópicas.',
        category: 'Quarto',
        type: 'Cômoda',
        price: 780.00,
        width: 90,
        height: 100,
        depth: 45
    },
    {
        title: 'Aparador Contemporâneo Espelhado',
        description: 'Aparador para hall de entrada com acabamento em espelho e pés palito.',
        category: 'Hall de Entrada',
        type: 'Aparador',
        price: 1100.00,
        width: 120,
        height: 80,
        depth: 40
    },
    {
        title: 'Banqueta Alta de Cozinha Metal',
        description: 'Banqueta industrial em aço carbono com pintura epóxi amarela, ideal para bancadas.',
        category: 'Cozinha',
        type: 'Banqueta',
        price: 215.00,
        width: 40,
        height: 75,
        depth: 40
    }
];

async function seed() {
    console.log('🌱 Starting database seeding...');
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('products');

        // Optional: Clear existing data
        const count = await collection.countDocuments();
        if (count > 0) {
            console.log(`⚠️ Database already has ${count} products. Skipping seed to avoid duplicates.`);
            return;
        }

        console.log(`📦 Inserting ${demoProducts.length} demo products...`);
        const result = await collection.insertMany(demoProducts as any);
        console.log(`✅ Success! Inserted ${result.insertedCount} products.`);

        // Create indexes for search
        console.log('🔍 Creating search indexes...');
        await collection.createIndex({ title: 'text', description: 'text', category: 'text', type: 'text' });
        await collection.createIndex({ category: 1 });
        await collection.createIndex({ type: 1 });
        console.log('✅ Indexes created.');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await client.close();
    }
}

seed();
