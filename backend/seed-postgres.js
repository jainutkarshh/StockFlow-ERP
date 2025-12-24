const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedData() {
    try {
        console.log('Starting database seeding...');

        // Seed default users
        const users = [
            { name: 'Admin User', email: 'admin@gmail.com', password: 'admin123' },
            { name: 'Boss', email: 'boss@gmail.com', password: 'boss123' },
            { name: 'Manager', email: 'manager@gmail.com', password: 'manager123' }
        ];

        console.log('Seeding users...');
        for (const user of users) {
            const password_hash = await bcrypt.hash(user.password, 12);
            try {
                await pool.query(
                    'INSERT INTO users (email, password_hash, name, provider) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
                    [user.email, password_hash, user.name, 'local']
                );
                console.log(`  ✓ Created user: ${user.email}`);
            } catch (err) {
                console.log(`  ! User ${user.email} already exists (skipped)`);
            }
        }

        // Seed default products
        const products = [
            // Bisleri
            { name: 'Bisleri', brand: 'Bisleri', size: '2 ltr', purchase_rate: 50, sale_rate: 60, min_stock: 20 },
            { name: 'Bisleri', brand: 'Bisleri', size: '1 ltr', purchase_rate: 25, sale_rate: 30, min_stock: 30 },
            { name: 'Bisleri', brand: 'Bisleri', size: '500 ml', purchase_rate: 15, sale_rate: 20, min_stock: 40 },
            { name: 'Bisleri', brand: 'Bisleri', size: '250 ml', purchase_rate: 10, sale_rate: 15, min_stock: 50 },
            { name: 'Bisleri', brand: 'Bisleri', size: '200 ml', purchase_rate: 8, sale_rate: 12, min_stock: 50 },
            { name: 'Bisleri Soda', brand: 'Bisleri', size: 'Soda', purchase_rate: 30, sale_rate: 40, min_stock: 20 },
            
            // Clear Water
            { name: 'Clear Water', brand: 'Clear Water', size: '1 ltr', purchase_rate: 22, sale_rate: 28, min_stock: 30 },
            { name: 'Clear Water', brand: 'Clear Water', size: '500 ml', purchase_rate: 12, sale_rate: 18, min_stock: 40 },
            { name: 'Clear Water', brand: 'Clear Water', size: '200 ml', purchase_rate: 7, sale_rate: 11, min_stock: 50 },
            { name: 'Clear Water', brand: 'Clear Water', size: '5 ltr', purchase_rate: 80, sale_rate: 100, min_stock: 10 },
            
            // Kinley
            { name: 'Kinley', brand: 'Kinley', size: '1 ltr', purchase_rate: 24, sale_rate: 32, min_stock: 30 },
            { name: 'Kinley', brand: 'Kinley', size: '500 ml', purchase_rate: 14, sale_rate: 20, min_stock: 40 },
            { name: 'Kinley Soda', brand: 'Kinley', size: '750 ml', purchase_rate: 35, sale_rate: 45, min_stock: 20 },
            
            // Soul
            { name: 'Soul', brand: 'Soul', size: '1 ltr', purchase_rate: 23, sale_rate: 30, min_stock: 25 },
            { name: 'Soul', brand: 'Soul', size: '500 ml', purchase_rate: 13, sale_rate: 18, min_stock: 35 },
            
            // Elite
            { name: 'Elite', brand: 'Elite', size: '1 ltr', purchase_rate: 21, sale_rate: 28, min_stock: 25 },
            { name: 'Elite', brand: 'Elite', size: '500 ml', purchase_rate: 11, sale_rate: 17, min_stock: 35 },
            
            // Green Ocean
            { name: 'Green Ocean', brand: 'Green Ocean', size: '1 ltr', purchase_rate: 20, sale_rate: 27, min_stock: 25 },
            { name: 'Green Ocean', brand: 'Green Ocean', size: '500 ml', purchase_rate: 10, sale_rate: 16, min_stock: 35 },
            
            // Cold Drinks
            { name: 'Coke', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Fanta', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Sprite', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Thums Up', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Maaza', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 20, sale_rate: 28, min_stock: 40 },
            
            // Cans
            { name: 'Coke Can', brand: 'Coca-Cola', size: '400 ml Can', purchase_rate: 45, sale_rate: 60, min_stock: 30 },
            { name: 'Fanta Can', brand: 'Coca-Cola', size: '400 ml Can', purchase_rate: 45, sale_rate: 60, min_stock: 30 },
            { name: 'Sprite Can', brand: 'Coca-Cola', size: '400 ml Can', purchase_rate: 45, sale_rate: 60, min_stock: 30 },
            { name: 'Thums Up Can', brand: 'Coca-Cola', size: '400 ml Can', purchase_rate: 45, sale_rate: 60, min_stock: 30 },
            { name: 'Diet Coke Can', brand: 'Coca-Cola', size: '400 ml Can', purchase_rate: 50, sale_rate: 65, min_stock: 20 },
            
            // Energy Drinks
            { name: 'Red Bull', brand: 'Red Bull', size: '250 ml Can', purchase_rate: 100, sale_rate: 120, min_stock: 20 },
            { name: 'Hell', brand: 'Hell', size: '250 ml Can', purchase_rate: 80, sale_rate: 100, min_stock: 25 },
            { name: 'Sting', brand: 'PepsiCo', size: '250 ml', purchase_rate: 25, sale_rate: 35, min_stock: 40 },
            
            // Lahoree
            { name: 'Lahoree Zeera', brand: 'Lahoree', size: '200 ml', purchase_rate: 12, sale_rate: 18, min_stock: 50 },
            { name: 'Lahoree Zeera', brand: 'Lahoree', size: '400 ml', purchase_rate: 22, sale_rate: 30, min_stock: 40 },
            { name: 'Lahoree Limbu', brand: 'Lahoree', size: '200 ml', purchase_rate: 12, sale_rate: 18, min_stock: 50 },
            { name: 'Lahoree Limbu', brand: 'Lahoree', size: '400 ml', purchase_rate: 22, sale_rate: 30, min_stock: 40 },
            
            // Local brands
            { name: 'Local Water', brand: 'Local', size: '1 ltr', purchase_rate: 18, sale_rate: 25, min_stock: 30 },
            { name: 'Local Water', brand: 'Local', size: '500 ml', purchase_rate: 10, sale_rate: 16, min_stock: 40 },
            { name: 'Local Water', brand: 'Local', size: '250 ml', purchase_rate: 8, sale_rate: 13, min_stock: 50 },
            { name: 'Local Water', brand: 'Local', size: '200 ml', purchase_rate: 7, sale_rate: 11, min_stock: 50 }
        ];

        console.log('Seeding products...');
        for (const product of products) {
            try {
                await pool.query(
                    `INSERT INTO products (name, brand, size, purchase_rate, sale_rate, min_stock, current_stock) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id) DO NOTHING`,
                    [product.name, product.brand, product.size, product.purchase_rate, product.sale_rate, product.min_stock, 0]
                );
            } catch (err) {
                if (!err.message.includes('ON CONFLICT')) {
                    console.error(`Error inserting product ${product.name}:`, err.message);
                }
            }
        }
        console.log(`  ✓ Seeded ${products.length} products`);

        // Seed default parties (clients/suppliers)
        const parties = [
            { name: 'Utkarsh Trading', type: 'supplier', phone: '9876543210', address: 'Mumbai', opening_balance: 0 },
            { name: 'XYZ Retail', type: 'client', phone: '9876543211', address: 'Delhi', opening_balance: 5000 },
            { name: 'ABC Store', type: 'client', phone: '9876543212', address: 'Bangalore', opening_balance: 3000 },
            { name: 'DEF Mart', type: 'supplier', phone: '9876543213', address: 'Chennai', opening_balance: 0 },
            { name: 'GHI Shop', type: 'client', phone: '9876543214', address: 'Hyderabad', opening_balance: 2000 }
        ];

        console.log('Seeding parties...');
        for (const party of parties) {
            try {
                await pool.query(
                    `INSERT INTO parties (name, type, phone, address, opening_balance) 
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (name) DO NOTHING`,
                    [party.name, party.type, party.phone, party.address, party.opening_balance]
                );
                console.log(`  ✓ Created party: ${party.name}`);
            } catch (err) {
                if (!err.message.includes('unique constraint')) {
                    console.error(`Error inserting party ${party.name}:`, err.message);
                }
            }
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\nDefault users created:');
        users.forEach(u => console.log(`  - ${u.email} / password: ${u.password}`));
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedData().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
