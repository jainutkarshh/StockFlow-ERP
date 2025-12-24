const db = require('./db');

async function seedData() {
    try {
        // Insert your custom brands and products
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
            
            // Cold Drinks - 250ml
            { name: 'Coke', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Fanta', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Sprite', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Thums Up', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 18, sale_rate: 25, min_stock: 50 },
            { name: 'Maaza', brand: 'Coca-Cola', size: '250 ml', purchase_rate: 20, sale_rate: 28, min_stock: 40 },
            
            // Cans - 400ml
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
            
            // Other local brands
            { name: 'Other Local', brand: 'Local', size: '1 ltr', purchase_rate: 18, sale_rate: 25, min_stock: 30 },
            { name: 'Other Local', brand: 'Local', size: '500 ml', purchase_rate: 10, sale_rate: 16, min_stock: 40 },
            { name: 'Other Local', brand: 'Local', size: '250 ml', purchase_rate: 8, sale_rate: 13, min_stock: 50 },
            { name: 'Other Local', brand: 'Local', size: '200 ml', purchase_rate: 7, sale_rate: 11, min_stock: 50 }
        ];

        for (const product of products) {
            await db.run(
                'INSERT OR IGNORE INTO products (name, brand, size, purchase_rate, sale_rate, min_stock) VALUES (?, ?, ?, ?, ?, ?)',
                [product.name, product.brand, product.size, product.purchase_rate, product.sale_rate, product.min_stock]
            );
        }

        console.log('Seed data inserted successfully');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

seedData().then(() => {
    console.log('Seeding completed');
    process.exit(0);
}).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
