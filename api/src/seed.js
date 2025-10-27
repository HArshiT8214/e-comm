const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await pool.execute(
      `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active) 
       VALUES ('Admin', 'User', 'admin@hpprinters.com', ?, 'admin', 1)`,
      [adminPassword]
    );

    // Create sample customers
    const customerPassword = await bcrypt.hash('customer123', 12);
    const [customerResult] = await pool.execute(
      `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active) 
       VALUES ('John', 'Doe', 'john@example.com', ?, 'customer', 1)`,
      [customerPassword]
    );

    const [customer2Result] = await pool.execute(
      `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active) 
       VALUES ('Jane', 'Smith', 'jane@example.com', ?, 'customer', 1)`,
      [customerPassword]
    );

    const [customer3Result] = await pool.execute(
      `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active) 
       VALUES ('Mike', 'Johnson', 'mike@example.com', ?, 'customer', 1)`,
      [customerPassword]
    );

    const [supportResult] = await pool.execute(
      `INSERT IGNORE INTO users (first_name, last_name, email, password_hash, role, is_active) 
       VALUES ('Support', 'Agent', 'support@hpprinters.com', ?, 'support', 1)`,
      [customerPassword]
    );

    // Add sample addresses for customers
    if (customerResult.insertId) {
      await pool.execute(
        `INSERT IGNORE INTO addresses (user_id, line1, city, state, zipcode, country, is_default) 
         VALUES (?, '123 Main St', 'New York', 'NY', '10001', 'USA', 1)`,
        [customerResult.insertId]
      );
      await pool.execute(
        `INSERT IGNORE INTO addresses (user_id, line1, line2, city, state, zipcode, country, is_default) 
         VALUES (?, '456 Oak Ave', 'Apt 2B', 'Los Angeles', 'CA', '90210', 'USA', 0)`,
        [customerResult.insertId]
      );
    }

    if (customer2Result.insertId) {
      await pool.execute(
        `INSERT IGNORE INTO addresses (user_id, line1, city, state, zipcode, country, is_default) 
         VALUES (?, '789 Pine St', 'Chicago', 'IL', '60601', 'USA', 1)`,
        [customer2Result.insertId]
      );
    }

    if (customer3Result.insertId) {
      await pool.execute(
        `INSERT IGNORE INTO addresses (user_id, line1, city, state, zipcode, country, is_default) 
         VALUES (?, '321 Elm St', 'Houston', 'TX', '77001', 'USA', 1)`,
        [customer3Result.insertId]
      );
    }

    // Insert comprehensive categories
    const categories = [
      { name: 'LaserJet Printers', parent_id: null },
      { name: 'DeskJet Printers', parent_id: null },
      { name: 'OfficeJet Printers', parent_id: null },
      { name: 'Ink Tank Printers', parent_id: null },
      { name: 'Toner Cartridges', parent_id: null },
      { name: 'Ink Cartridges', parent_id: null },
      { name: 'Paper & Media', parent_id: null },
      { name: 'Accessories', parent_id: null },
      { name: 'Wireless Printers', parent_id: null },
      { name: 'Photo Printers', parent_id: null },
      { name: 'All-in-One Printers', parent_id: null },
      { name: 'Monochrome Printers', parent_id: null }
    ];

    for (const category of categories) {
      await pool.execute(
        'INSERT IGNORE INTO categories (name, parent_id) VALUES (?, ?)',
        [category.name, category.parent_id]
      );
    }

    // Get category IDs
    const [categoryRows] = await pool.execute('SELECT category_id, name FROM categories');
    const categoryMap = {};
    categoryRows.forEach(row => {
      categoryMap[row.name] = row.category_id;
    });

    // Insert comprehensive sample products
    const products = [
      {
        name: 'HP LaserJet Pro M404n',
        description: 'Fast, reliable monochrome laser printer perfect for small offices. Prints up to 38 pages per minute with professional quality.',
        category_id: categoryMap['LaserJet Printers'],
        price: 299.99,
        stock_quantity: 15,
        sku: 'HP-LASER-404N',
        image_url: '/images/laserjet-m404n.jpg',
        brand: 'HP'
      },
      {
        name: 'HP LaserJet Pro M15w',
        description: 'Compact wireless laser printer for home offices. Easy setup and mobile printing capabilities.',
        category_id: categoryMap['LaserJet Printers'],
        price: 199.99,
        stock_quantity: 20,
        sku: 'HP-LASER-M15W',
        image_url: '/images/laserjet-m15w.jpg',
        brand: 'HP'
      },
      {
        name: 'HP LaserJet Pro M404dn',
        description: 'Monochrome laser printer with duplex printing. Perfect for high-volume printing needs.',
        category_id: categoryMap['LaserJet Printers'],
        price: 399.99,
        stock_quantity: 8,
        sku: 'HP-LASER-404DN',
        image_url: '/images/laserjet-m404dn.jpg',
        brand: 'HP'
      },
      {
        name: 'HP OfficeJet Pro 9015',
        description: 'All-in-one printer with wireless printing, scanning, copying, and faxing capabilities. Perfect for home offices.',
        category_id: categoryMap['OfficeJet Printers'],
        price: 399.99,
        stock_quantity: 8,
        sku: 'HP-OFFICE-9015',
        image_url: '/images/officejet-9015.jpg',
        brand: 'HP'
      },
      {
        name: 'HP OfficeJet Pro 8025e',
        description: 'Smart all-in-one printer with wireless connectivity and mobile printing. Great for small businesses.',
        category_id: categoryMap['OfficeJet Printers'],
        price: 329.99,
        stock_quantity: 12,
        sku: 'HP-OFFICE-8025E',
        image_url: '/images/officejet-8025e.jpg',
        brand: 'HP'
      },
      {
        name: 'HP OfficeJet Pro 9018e',
        description: 'All-in-one printer with smart features and wireless connectivity. Perfect for home and small office.',
        category_id: categoryMap['OfficeJet Printers'],
        price: 449.99,
        stock_quantity: 6,
        sku: 'HP-OFFICE-9018E',
        image_url: '/images/officejet-9018e.jpg',
        brand: 'HP'
      },
      {
        name: 'HP DeskJet 2755e',
        description: 'Compact wireless all-in-one printer with mobile printing capabilities. Great for students and home use.',
        category_id: categoryMap['DeskJet Printers'],
        price: 149.99,
        stock_quantity: 25,
        sku: 'HP-DESKJET-2755E',
        image_url: '/images/deskjet-2755e.jpg',
        brand: 'HP'
      },
      {
        name: 'HP DeskJet 4155e',
        description: 'Wireless all-in-one printer with smart features and mobile printing. Perfect for home and small office.',
        category_id: categoryMap['DeskJet Printers'],
        price: 179.99,
        stock_quantity: 18,
        sku: 'HP-DESKJET-4155E',
        image_url: '/images/deskjet-4155e.jpg',
        brand: 'HP'
      },
      {
        name: 'HP DeskJet 3755',
        description: 'Compact all-in-one printer with wireless connectivity. Great for students and home use.',
        category_id: categoryMap['DeskJet Printers'],
        price: 129.99,
        stock_quantity: 30,
        sku: 'HP-DESKJET-3755',
        image_url: '/images/deskjet-3755.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Smart Tank 6001',
        description: 'High-yield ink tank printer with wireless connectivity. Print thousands of pages with original HP ink.',
        category_id: categoryMap['Ink Tank Printers'],
        price: 249.99,
        stock_quantity: 12,
        sku: 'HP-SMARTTANK-6001',
        image_url: '/images/smart-tank-6001.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Smart Tank 7001',
        description: 'All-in-one ink tank printer with wireless connectivity and mobile printing. High-volume printing solution.',
        category_id: categoryMap['Ink Tank Printers'],
        price: 299.99,
        stock_quantity: 10,
        sku: 'HP-SMARTTANK-7001',
        image_url: '/images/smart-tank-7001.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Smart Tank 5001',
        description: 'Ink tank printer with wireless connectivity. Great for high-volume printing at home.',
        category_id: categoryMap['Ink Tank Printers'],
        price: 199.99,
        stock_quantity: 15,
        sku: 'HP-SMARTTANK-5001',
        image_url: '/images/smart-tank-5001.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Envy Photo 7155',
        description: 'Wireless all-in-one photo printer with borderless printing and mobile printing capabilities.',
        category_id: categoryMap['Photo Printers'],
        price: 199.99,
        stock_quantity: 15,
        sku: 'HP-ENVY-PHOTO-7155',
        image_url: '/images/envy-photo-7155.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Envy Photo 7855',
        description: 'All-in-one photo printer with wireless connectivity and mobile printing. Perfect for photo enthusiasts.',
        category_id: categoryMap['Photo Printers'],
        price: 249.99,
        stock_quantity: 12,
        sku: 'HP-ENVY-PHOTO-7855',
        image_url: '/images/envy-photo-7855.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 305A Black Toner Cartridge',
        description: 'Original HP toner cartridge for LaserJet Pro printers. High yield, reliable printing.',
        category_id: categoryMap['Toner Cartridges'],
        price: 89.99,
        stock_quantity: 50,
        sku: 'HP-TONER-305A-BLACK',
        image_url: '/images/toner-305a-black.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 305A Color Toner Cartridge Set',
        description: 'Complete set of original HP color toner cartridges for LaserJet Pro printers.',
        category_id: categoryMap['Toner Cartridges'],
        price: 249.99,
        stock_quantity: 30,
        sku: 'HP-TONER-305A-COLOR-SET',
        image_url: '/images/toner-305a-color-set.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 410A Black Toner Cartridge',
        description: 'High-yield black toner cartridge for HP LaserJet Pro printers. Professional quality printing.',
        category_id: categoryMap['Toner Cartridges'],
        price: 119.99,
        stock_quantity: 40,
        sku: 'HP-TONER-410A-BLACK',
        image_url: '/images/toner-410a-black.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 65 Black Ink Cartridge',
        description: 'Original HP ink cartridge for DeskJet printers. High-quality printing for documents and photos.',
        category_id: categoryMap['Ink Cartridges'],
        price: 24.99,
        stock_quantity: 100,
        sku: 'HP-INK-65-BLACK',
        image_url: '/images/ink-65-black.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 65 Color Ink Cartridge Set',
        description: 'Complete set of original HP color ink cartridges for DeskJet printers.',
        category_id: categoryMap['Ink Cartridges'],
        price: 69.99,
        stock_quantity: 80,
        sku: 'HP-INK-65-COLOR-SET',
        image_url: '/images/ink-65-color-set.jpg',
        brand: 'HP'
      },
      {
        name: 'HP 67 Black Ink Cartridge',
        description: 'High-yield black ink cartridge for HP DeskJet printers. More pages per cartridge.',
        category_id: categoryMap['Ink Cartridges'],
        price: 34.99,
        stock_quantity: 90,
        sku: 'HP-INK-67-BLACK',
        image_url: '/images/ink-67-black.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Premium A4 Paper (500 sheets)',
        description: 'High-quality A4 paper for professional printing. 20lb weight, 96 brightness.',
        category_id: categoryMap['Paper & Media'],
        price: 19.99,
        stock_quantity: 200,
        sku: 'HP-PAPER-A4-500',
        image_url: '/images/paper-a4-500.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Photo Paper Glossy (50 sheets)',
        description: 'High-quality glossy photo paper for vibrant photo printing. 4x6 inch size.',
        category_id: categoryMap['Paper & Media'],
        price: 24.99,
        stock_quantity: 150,
        sku: 'HP-PHOTO-PAPER-GLOSSY-50',
        image_url: '/images/photo-paper-glossy.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Premium A4 Paper (1000 sheets)',
        description: 'Bulk pack of high-quality A4 paper for high-volume printing. 20lb weight, 96 brightness.',
        category_id: categoryMap['Paper & Media'],
        price: 34.99,
        stock_quantity: 100,
        sku: 'HP-PAPER-A4-1000',
        image_url: '/images/paper-a4-1000.jpg',
        brand: 'HP'
      },
      {
        name: 'HP USB-C Cable 6ft',
        description: 'High-speed USB-C cable for connecting printers to computers and mobile devices.',
        category_id: categoryMap['Accessories'],
        price: 29.99,
        stock_quantity: 75,
        sku: 'HP-CABLE-USB-C-6FT',
        image_url: '/images/usb-c-cable.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Wireless Setup Kit',
        description: 'Complete wireless setup kit including USB cable and setup guide for easy printer installation.',
        category_id: categoryMap['Accessories'],
        price: 49.99,
        stock_quantity: 40,
        sku: 'HP-WIRELESS-SETUP-KIT',
        image_url: '/images/wireless-setup-kit.jpg',
        brand: 'HP'
      },
      {
        name: 'HP Printer Stand',
        description: 'Adjustable printer stand with storage compartments. Perfect for organizing your workspace.',
        category_id: categoryMap['Accessories'],
        price: 79.99,
        stock_quantity: 25,
        sku: 'HP-PRINTER-STAND',
        image_url: '/images/printer-stand.jpg',
        brand: 'HP'
      }
    ];

    for (const product of products) {
      if (product.category_id) {
        await pool.execute(
          `INSERT IGNORE INTO products (name, description, category_id, price, stock_quantity, sku, image_url, brand) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [product.name, product.description, product.category_id, product.price, product.stock_quantity, product.sku, product.image_url, product.brand]
        );
      }
    }

    // Get product IDs for creating sample data
    const [productRows] = await pool.execute('SELECT product_id, name FROM products');
    const productMap = {};
    productRows.forEach(row => {
      productMap[row.name] = row.product_id;
    });

    // Insert sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discount_type: 'percent',
        discount_value: 10,
        max_uses: 1000,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        code: 'SAVE50',
        description: 'Fixed amount discount',
        discount_type: 'amount',
        discount_value: 50,
        max_uses: 100,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        code: 'BULK20',
        description: 'Bulk purchase discount',
        discount_type: 'percent',
        discount_value: 20,
        max_uses: 50,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        code: 'PRINTER15',
        description: 'Printer purchase discount',
        discount_type: 'percent',
        discount_value: 15,
        max_uses: 200,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
      }
    ];

    for (const coupon of coupons) {
      await pool.execute(
        `INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_to, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [coupon.code, coupon.description, coupon.discount_type, coupon.discount_value, coupon.max_uses, coupon.valid_from, coupon.valid_to]
      );
    }

    // Create sample carts and cart items for multiple users
    const customers = [customerResult.insertId, customer2Result.insertId, customer3Result.insertId];
    
    for (let i = 0; i < customers.length; i++) {
      if (customers[i]) {
        await pool.execute(
          'INSERT IGNORE INTO carts (user_id) VALUES (?)',
          [customers[i]]
        );
        
        const [cartResult] = await pool.execute('SELECT cart_id FROM carts WHERE user_id = ?', [customers[i]]);
        if (cartResult.length > 0) {
          const cartId = cartResult[0].cart_id;
          
          // Add different items to each cart
          const cartItems = [
            [productMap['HP LaserJet Pro M404n'], 1, 299.99],
            [productMap['HP 305A Black Toner Cartridge'], 2, 89.99],
            [productMap['HP DeskJet 2755e'], 1, 149.99],
            [productMap['HP 65 Black Ink Cartridge'], 3, 24.99],
            [productMap['HP Smart Tank 6001'], 1, 249.99],
            [productMap['HP Premium A4 Paper (500 sheets)'], 2, 19.99]
          ];
          
          // Add 2-3 random items to each cart
          const itemsToAdd = cartItems.slice(i * 2, (i + 1) * 2 + 1);
          for (const [productId, quantity, price] of itemsToAdd) {
            if (productId) {
              await pool.execute(
                'INSERT IGNORE INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [cartId, productId, quantity, price]
              );
            }
          }
        }
      }
    }

    // Create sample orders for different customers
    for (let i = 0; i < customers.length; i++) {
      if (customers[i]) {
        const [addressResult] = await pool.execute('SELECT address_id FROM addresses WHERE user_id = ? AND is_default = 1', [customers[i]]);
        const addressId = addressResult[0]?.address_id;

        if (addressId) {
          // Create a completed order
          const [orderResult] = await pool.execute(
            `INSERT IGNORE INTO orders (user_id, status, total_amount, subtotal_amount, shipping_amount, tax_amount, shipping_address_id, billing_address_id) 
             VALUES (?, 'delivered', ?, ?, 15.00, ?, ?, ?)`,
            [customers[i], 400 + (i * 100), 350 + (i * 100), 35 + (i * 10), addressId, addressId]
          );

          if (orderResult.insertId) {
            const orderId = orderResult.insertId;
            
            // Add order items
            const orderItems = [
              [productMap['HP LaserJet Pro M404n'], 1, 299.99, 299.99],
              [productMap['HP 305A Black Toner Cartridge'], 1, 89.99, 89.99],
              [productMap['HP DeskJet 2755e'], 1, 149.99, 149.99],
              [productMap['HP 65 Black Ink Cartridge'], 2, 24.99, 49.98]
            ];
            
            const itemsForOrder = orderItems.slice(i, i + 2);
            for (const [productId, quantity, unitPrice, subtotal] of itemsForOrder) {
              if (productId) {
                await pool.execute(
                  'INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                  [orderId, productId, quantity, unitPrice, subtotal]
                );
              }
            }

            // Create payment record
            await pool.execute(
              'INSERT IGNORE INTO payments (order_id, method, status, transaction_id, amount, paid_at) VALUES (?, ?, ?, ?, ?, ?)',
              [orderId, 'credit_card', 'success', 'TXN_' + Date.now() + '_' + i, 400 + (i * 100), new Date()]
            );

            // Create shipping record
            await pool.execute(
              'INSERT IGNORE INTO shipping (order_id, carrier, tracking_number, status, shipped_at, delivered_at) VALUES (?, ?, ?, ?, ?, ?)',
              [orderId, 'FedEx', 'FX' + Math.random().toString(36).substr(2, 9).toUpperCase(), 'delivered', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)]
            );
          }

          // Create a pending order for some customers
          if (i < 2) {
            const [pendingOrderResult] = await pool.execute(
              `INSERT IGNORE INTO orders (user_id, status, total_amount, subtotal_amount, shipping_amount, tax_amount, shipping_address_id, billing_address_id) 
               VALUES (?, 'pending', ?, ?, 15.00, ?, ?, ?)`,
              [customers[i], 200 + (i * 50), 150 + (i * 50), 35 + (i * 10), addressId, addressId]
            );

            if (pendingOrderResult.insertId) {
              const pendingOrderId = pendingOrderResult.insertId;
              
              await pool.execute(
                'INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                [pendingOrderId, productMap['HP DeskJet 2755e'], 1, 149.99, 149.99]
              );
            }
          }
        }
      }
    }

    // Create sample reviews
    const reviews = [
      {
        user_id: customerResult.insertId,
        product_id: productMap['HP LaserJet Pro M404n'],
        rating: 5,
        comment: 'Excellent printer! Fast and reliable. Perfect for my small office.'
      },
      {
        user_id: customerResult.insertId,
        product_id: productMap['HP 305A Black Toner Cartridge'],
        rating: 4,
        comment: 'Good quality toner, lasts a long time. Would recommend.'
      },
      {
        user_id: customer2Result.insertId,
        product_id: productMap['HP DeskJet 2755e'],
        rating: 5,
        comment: 'Great printer for home use. Easy setup and wireless printing works perfectly.'
      },
      {
        user_id: customer2Result.insertId,
        product_id: productMap['HP OfficeJet Pro 9015'],
        rating: 4,
        comment: 'Good all-in-one printer. Scanning and copying features work well.'
      },
      {
        user_id: customer3Result.insertId,
        product_id: productMap['HP Smart Tank 6001'],
        rating: 5,
        comment: 'Amazing value! The ink tanks last forever and print quality is excellent.'
      },
      {
        user_id: customer3Result.insertId,
        product_id: productMap['HP Envy Photo 7155'],
        rating: 4,
        comment: 'Great for photo printing. Colors are vibrant and prints are sharp.'
      }
    ];

    for (const review of reviews) {
      if (review.user_id && review.product_id) {
        await pool.execute(
          'INSERT IGNORE INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
          [review.user_id, review.product_id, review.rating, review.comment]
        );
      }
    }

    // Create sample support tickets
    const tickets = [
      {
        user_id: customerResult.insertId,
        subject: 'Printer not connecting to WiFi',
        description: 'My HP LaserJet Pro M404n is not connecting to my home WiFi network. I have tried restarting both the printer and router.',
        status: 'open'
      },
      {
        user_id: customerResult.insertId,
        subject: 'Order delivery inquiry',
        description: 'I placed an order last week and would like to know the current status of my delivery.',
        status: 'resolved'
      },
      {
        user_id: customer2Result.insertId,
        subject: 'Toner cartridge compatibility',
        description: 'I need help finding the right toner cartridge for my HP LaserJet Pro M15w printer.',
        status: 'in_progress'
      },
      {
        user_id: customer3Result.insertId,
        subject: 'Print quality issues',
        description: 'My HP DeskJet 2755e is producing blurry prints. I have tried cleaning the print heads but the issue persists.',
        status: 'open'
      },
      {
        user_id: customer3Result.insertId,
        subject: 'Return request',
        description: 'I would like to return my HP Smart Tank 6001 printer as it does not meet my requirements.',
        status: 'resolved'
      }
    ];

    for (const ticket of tickets) {
      if (ticket.user_id) {
        await pool.execute(
          'INSERT IGNORE INTO support_tickets (user_id, subject, description, status) VALUES (?, ?, ?, ?)',
          [ticket.user_id, ticket.subject, ticket.description, ticket.status]
        );
      }
    }

    // Create inventory movements for testing
    const inventoryMovements = [
      {
        product_id: productMap['HP LaserJet Pro M404n'],
        delta_quantity: -3,
        reason: 'order',
        reference_type: 'order',
        reference_id: 1
      },
      {
        product_id: productMap['HP 305A Black Toner Cartridge'],
        delta_quantity: 50,
        reason: 'restock',
        reference_type: 'purchase',
        reference_id: 1
      },
      {
        product_id: productMap['HP DeskJet 2755e'],
        delta_quantity: -5,
        reason: 'order',
        reference_type: 'order',
        reference_id: 2
      },
      {
        product_id: productMap['HP 65 Black Ink Cartridge'],
        delta_quantity: 100,
        reason: 'restock',
        reference_type: 'purchase',
        reference_id: 2
      },
      {
        product_id: productMap['HP Smart Tank 6001'],
        delta_quantity: -2,
        reason: 'order',
        reference_type: 'order',
        reference_id: 3
      }
    ];

    for (const movement of inventoryMovements) {
      if (movement.product_id) {
        await pool.execute(
          'INSERT IGNORE INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
          [movement.product_id, movement.delta_quantity, movement.reason, movement.reference_type, movement.reference_id]
        );
      }
    }

    console.log('✅ Comprehensive database seeding completed successfully!');
    console.log('📧 Admin login: admin@hpprinters.com / admin123');
    console.log('👤 Customer 1 login: john@example.com / customer123');
    console.log('👤 Customer 2 login: jane@example.com / customer123');
    console.log('👤 Customer 3 login: mike@example.com / customer123');
    console.log('�� Support login: support@hpprinters.com / customer123');
    console.log('🎫 Test coupons: WELCOME10 (10% off), SAVE50 ($50 off), BULK20 (20% off), PRINTER15 (15% off)');
    console.log('📦 Sample data includes:');
    console.log('   - 25 products across 12 categories');
    console.log('   - 3 customer accounts with addresses');
    console.log('   - 4 active coupons');
    console.log('   - 3 shopping carts with items');
    console.log('   - 6 orders (3 delivered, 2 pending)');
    console.log('   - 6 product reviews');
    console.log('   - 5 support tickets');
    console.log('   - 5 inventory movements');
    console.log('   - 1 admin account');
    console.log('   - 1 support agent account');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
};

seedData();
