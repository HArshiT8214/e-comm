# HP Printer E-commerce Backend

A comprehensive backend API for the HP Printer E-commerce platform built with Node.js, Express, and MySQL.

## Features

### 🔐 User Management Service
- User registration and authentication
- JWT-based authentication
- Password reset functionality
- User profile management
- Address management
- Role-based access control (customer, admin, support)

### 📦 Product Catalog Service
- Product CRUD operations
- Category management
- Product search and filtering
- Inventory management
- Product images support
- SEO-friendly product descriptions

### 🛒 Shopping Cart Service
- Session-based cart management
- Add/update/remove items
- Cart validation
- Stock checking

### 📋 Order Management Service
- Order creation from cart
- Order tracking and status updates
- Payment integration
- Invoice generation
- Order history

### ⭐ Reviews & Ratings Service
- Product reviews and ratings
- Review validation (purchase required)
- Rating statistics
- Review moderation

### 🎫 Customer Support Service
- Support ticket system
- Knowledge base integration
- Ticket status management
- Admin support dashboard

### 💰 Pricing & Discounts Service
- Coupon management
- Dynamic pricing
- Bulk purchase pricing
- Seasonal sales

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiting
- **Email**: nodemailer

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hp_printer_shop
   DB_PORT=3306
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Database Setup**
   - Create MySQL database using the schema file:
   ```bash
   mysql -u root -p < ../db/schema.sql
   ```

5. **Seed Database** (Optional)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /addresses` - Add address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address

### Products (`/api/products`)
- `GET /` - Get all products (with filters)
- `GET /:id` - Get product by ID
- `GET /search/:query` - Search products
- `GET /featured/list` - Get featured products
- `GET /categories/list` - Get categories
- `POST /` - Create product (admin)
- `PUT /:id` - Update product (admin)
- `DELETE /:id` - Delete product (admin)
- `PUT /:id/stock` - Update stock (admin)

### Cart (`/api/cart`)
- `GET /` - Get cart items
- `GET /count` - Get cart item count
- `POST /add` - Add item to cart
- `PUT /items/:id` - Update cart item
- `DELETE /items/:id` - Remove cart item
- `DELETE /clear` - Clear cart
- `GET /validate` - Validate cart

### Orders (`/api/orders`)
- `POST /` - Create order
- `GET /` - Get user orders
- `GET /:id` - Get order by ID
- `PUT /:id/cancel` - Cancel order
- `PUT /:id/status` - Update order status (admin)
- `GET /admin/all` - Get all orders (admin)
- `GET /admin/statistics` - Get order statistics (admin)

### Reviews (`/api/reviews`)
- `POST /:productId` - Add review
- `GET /product/:productId` - Get product reviews
- `GET /product/:productId/stats` - Get review statistics
- `GET /user/my-reviews` - Get user reviews
- `PUT /:id` - Update review
- `DELETE /:id` - Delete review
- `GET /admin/recent` - Get recent reviews (admin)

### Support (`/api/support`)
- `POST /tickets` - Create support ticket
- `GET /tickets` - Get user tickets
- `GET /tickets/:id` - Get ticket by ID
- `GET /knowledge-base/search` - Search knowledge base
- `GET /admin/tickets` - Get all tickets (admin)
- `PUT /admin/tickets/:id/status` - Update ticket status (admin)
- `GET /admin/statistics` - Get ticket statistics (admin)

## Database Schema

The database includes the following main tables:
- `users` - User accounts and authentication
- `addresses` - User shipping/billing addresses
- `categories` - Product categories
- `products` - Product catalog
- `product_images` - Product images
- `inventory_movements` - Stock tracking
- `carts` & `cart_items` - Shopping cart
- `orders` & `order_items` - Order management
- `payments` - Payment records
- `shipping` - Shipping tracking
- `reviews` - Product reviews
- `support_tickets` - Customer support
- `coupons` - Discount codes

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Error Handling

Comprehensive error handling with:
- Structured error responses
- HTTP status codes
- Detailed error messages
- Database error handling
- Validation error handling

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Environment Variables
See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
