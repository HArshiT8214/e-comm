const { pool } = require('./config/database'); // Ensure this connects to PostgreSQL
const bcrypt = require('bcryptjs');

// Helper to convert '?' placeholders to PostgreSQL's '$1, $2, ...'
const buildPostgresQuery = (sql, params) => {
    if (!params) return [sql, []];
    let index = 1;
    // Replace all '?' with $1, $2, etc.
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
};

// Helper to execute a query, converting placeholders and using pool.query
const executeQuery = async (sql, params = []) => {
    const [query, pgParams] = buildPostgresQuery(sql, params);
    try {
        // Use pool.query for pg, not pool.execute
        const result = await pool.query(query, pgParams);
        // For INSERT/UPDATE/DELETE, result.rowCount is used.
        // For SELECT/RETURNING, result.rows is used.
        return result;
    } catch (error) {
        console.error(`Query failed: ${query}`, error.message);
        throw error; // Re-throw the error to stop the seeding process on failure
    }
};


const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding for PostgreSQL...');
    
    // ------------------------------------------------------------------
    // 1. Create Users
    // ------------------------------------------------------------------
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) 
        VALUES ('Admin', 'User', $1, $2, $3, TRUE)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id
    `;
    const adminResult = await executeQuery(adminQuery, ['admin@hpprinters.com', adminPassword, 'admin']);

    const customerPassword = await bcrypt.hash('customer123', 12);
    const usersToCreate = [
        { email: 'john@example.com', firstName: 'John', lastName: 'Doe', role: 'customer' },
        { email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', role: 'customer' },
        { email: 'mike@example.com', firstName: 'Mike', lastName: 'Johnson', role: 'customer' },
        { email: 'support@hpprinters.com', firstName: 'Support', lastName: 'Agent', role: 'support' }
    ];
    for (const user of usersToCreate) {
        const userQuery = `
            INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) 
            VALUES ($1, $2, $3, $4, $5, TRUE)
            ON CONFLICT (email) DO NOTHING
        `;
        await executeQuery(userQuery, [user.firstName, user.lastName, user.email, customerPassword, user.role]);
    }
    
    const userResult = await executeQuery('SELECT user_id, email FROM users');
    const userRows = userResult.rows; 
    const userMap = {};
    userRows.forEach(row => { userMap[row.email] = row.user_id; });

    const johnId = userMap['john@example.com'];
    const janeId = userMap['jane@example.com'];
    const mikeId = userMap['mike@example.com'];

    // ------------------------------------------------------------------
    // 2. Add sample addresses
    // ------------------------------------------------------------------
    const insertAddressQuery = `
        INSERT INTO addresses (user_id, line1, line2, city, state, zipcode, country, is_default) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    if (johnId) {
      await executeQuery(insertAddressQuery, [johnId, '123 Main St', null, 'New York', 'NY', '10001', 'USA', true]);
      await executeQuery(insertAddressQuery, [johnId, '456 Oak Ave', 'Apt 2B', 'Los Angeles', 'CA', '90210', 'USA', false]);
    }
    if (janeId) {
      await executeQuery(insertAddressQuery, [janeId, '789 Pine St', null, 'Chicago', 'IL', '60601', 'USA', true]);
    }

    // ------------------------------------------------------------------
    // 3. Insert comprehensive categories
    // ------------------------------------------------------------------
    const categories = [
      { name: 'LaserJet Printers', parent_id: null },
      { name: 'DeskJet Printers', parent_id: null },
      { name: 'OfficeJet Printers', parent_id: null },
      { name: 'Ink Tank Printers', parent_id: null },
      { name: 'Toner Cartridges', parent_id: null },
      { name: 'Ink Cartridges', parent_id: null },
      { name: 'Paper & Media', parent_id: null },
      { name: 'Accessories', parent_id: null }
    ];
    const insertCategoryQuery = `
        INSERT INTO categories (name, parent_id) 
        VALUES ($1, $2)
    `;
    for (const category of categories) {
      await executeQuery(insertCategoryQuery, [category.name, category.parent_id]);
    }

    // ------------------------------------------------------------------
    // 4. Insert comprehensive sample products
    // ------------------------------------------------------------------
    const products = [
      { name: 'HP LaserJet Pro M404n', description: 'Fast, reliable monochrome laser printer.', category: 'LaserJet Printers', price: 299.99, stock_quantity: 15, image_url: '/images/laserjet-m404n.jpg' },
      { name: 'HP OfficeJet Pro 9015', description: 'All-in-one printer with wireless printing.', category: 'OfficeJet Printers', price: 399.99, stock_quantity: 8, image_url: '/images/officejet-9015.jpg' },
      { name: 'HP DeskJet 2755e', description: 'Compact wireless all-in-one printer.', category: 'DeskJet Printers', price: 149.99, stock_quantity: 25, image_url: '/images/deskjet-2755e.jpg' },
      { name: 'HP Smart Tank 6001', description: 'High-yield ink tank printer.', category: 'Ink Tank Printers', price: 249.99, stock_quantity: 12, image_url: '/images/smart-tank-6001.jpg' },
      { name: 'HP 305A Black Toner Cartridge', description: 'Original HP toner cartridge.', category: 'Toner Cartridges', price: 89.99, stock_quantity: 50, image_url: '/images/toner-305a-black.jpg' },
      { name: 'HP 65 Black Ink Cartridge', description: 'Original HP ink cartridge.', category: 'Ink Cartridges', price: 24.99, stock_quantity: 100, image_url: '/images/ink-65-black.jpg' },
      { name: 'HP Premium A4 Paper (500 sheets)', description: 'High-quality A4 paper.', category: 'Paper & Media', price: 19.99, stock_quantity: 200, image_url: '/images/paper-a4-500.jpg' },
      { name: 'HP USB-C Cable 6ft', description: 'High-speed USB-C cable.', category: 'Accessories', price: 29.99, stock_quantity: 75, image_url: '/images/usb-c-cable.jpg' }
    ];

    const insertProductQuery = `
        INSERT INTO products (name, description, category, price, stock_quantity, image_url) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING product_id
    `;
    for (const product of products) {
        await executeQuery(insertProductQuery, [
          product.name, 
          product.description, 
          product.category, 
          product.price, 
          product.stock_quantity, 
          product.image_url
        ]);
    }

    const productResult = await executeQuery('SELECT product_id, name FROM products');
    const productRows = productResult.rows;
    const productMap = {};
    productRows.forEach(row => {
      productMap[row.name] = row.product_id;
    });
    
    // ------------------------------------------------------------------
    // 5. Insert sample coupons (Skipping, table does not exist in schema-postgres.sql)
    // ------------------------------------------------------------------
    try {
        const insertCouponQuery = `
            INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_to, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
            ON CONFLICT (code) DO NOTHING
        `;
        await executeQuery(insertCouponQuery, ['WELCOME10', 'Welcome discount', 'percent', 10, 1000, new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);
    } catch(e) {
        console.warn('Coupon seeding skipped: "coupons" table does not exist in schema-postgres.sql.');
    }

    // ------------------------------------------------------------------
    // 6. Create sample cart items (SCHEMA FIX: Inserting into cart_items directly)
    // ------------------------------------------------------------------
    console.log('Seeding cart_items (Note: "carts" table does not exist in schema-postgres.sql)...');
    
    const insertCartItemQuery = `
        INSERT INTO cart_items (user_id, product_id, quantity) 
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO NOTHING
    `;

    try {
        if (johnId && productMap['HP LaserJet Pro M404n']) {
            await executeQuery(insertCartItemQuery, [johnId, productMap['HP LaserJet Pro M404n'], 1]);
        }
        if (janeId && productMap['HP OfficeJet Pro 9015']) {
            await executeQuery(insertCartItemQuery, [janeId, productMap['HP OfficeJet Pro 9015'], 2]);
        }
    } catch (e) {
        console.error('Failed to seed cart_items:', e.message);
    }

    // ------------------------------------------------------------------
    // 7. Create sample orders for different customers (SCHEMA FIX: Using shipping_address TEXT)
    // ------------------------------------------------------------------
    console.log('Seeding orders...');
    
    const insertOrderQuery = `
        INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING order_id
    `;
    
    const insertOrderItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price) 
        VALUES ($1, $2, $3, $4)
    `;
    
    // Order 1 for John
    try {
        if (johnId && productMap['HP LaserJet Pro M404n']) {
            const orderResult = await executeQuery(insertOrderQuery, [
                johnId, 
                320.99, 
                'delivered', 
                '123 Main St, New York, NY 10001, USA', 
                'credit_card', 
                'paid'
            ]);
            const orderId = orderResult.rows[0]?.order_id;
            if (orderId) {
                await executeQuery(insertOrderItemQuery, [orderId, productMap['HP LaserJet Pro M404n'], 1, 299.99]);
            }
        }
    } catch (e) { console.error('Failed to seed order 1:', e.message); }

    // Order 2 for Jane
    try {
        if (janeId && productMap['HP OfficeJet Pro 9015']) {
            const orderResult = await executeQuery(insertOrderQuery, [
                janeId,
                450.00,
                'pending',
                '789 Pine St, Chicago, IL 60601, USA',
                'paypal',
                'pending'
            ]);
            const orderId = orderResult.rows[0]?.order_id;
            if (orderId) {
                await executeQuery(insertOrderItemQuery, [orderId, productMap['HP OfficeJet Pro 9015'], 1, 399.99]);
            }
        }
    } catch (e) { console.error('Failed to seed order 2:', e.message); }

    // ------------------------------------------------------------------
    // 8. Create sample reviews
    // ------------------------------------------------------------------
    console.log('Seeding reviews...');
    const insertReviewQuery = `
        INSERT INTO reviews (user_id, product_id, rating, comment) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, product_id) DO NOTHING
    `;
    try {
        if (johnId && productMap['HP LaserJet Pro M404n']) {
            await executeQuery(insertReviewQuery, [johnId, productMap['HP LaserJet Pro M404n'], 5, 'Excellent printer! Fast and reliable.']);
        }
    } catch (e) { console.error('Failed to seed review 1:', e.message); }

    // ------------------------------------------------------------------
    // 9. Create sample support tickets
    // ------------------------------------------------------------------
    console.log('Seeding support tickets...');
    const insertTicketQuery = `
        INSERT INTO support_tickets (user_id, subject, description, status, priority) 
        VALUES ($1, $2, $3, $4, $5)
    `;
    try {
        if (johnId) {
            await executeQuery(insertTicketQuery, [johnId, 'Printer not connecting to WiFi', 'My HP LaserJet Pro M404n is not connecting...', 'open', 'high']);
        }
    } catch (e) { console.error('Failed to seed ticket 1:', e.message); }

    // ------------------------------------------------------------------
    // 10. Create inventory movements (Skipping, table does not exist in schema-postgres.sql)
    // ------------------------------------------------------------------
    try {
        const insertInventoryMovementQuery = `INSERT INTO inventory_movements (product_id, delta_quantity, reason) VALUES ($1, $2, $3)`;
        await executeQuery(insertInventoryMovementQuery, [productMap['HP LaserJet Pro M404n'], -1, 'order']);
    } catch(e) { 
        console.warn('Inventory movement seeding skipped: "inventory_movements" table does not exist in schema-postgres.sql.'); 
    }


    console.log('✅ Comprehensive database seeding completed successfully!');
    console.log('📧 Admin login: admin@hpprinters.com / admin123');
    console.log('👤 Customer 1 login: john@example.com / customer123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Gracefully end the process
    pool.end ? pool.end() : process.exit(0);
  }
};

seedData();

