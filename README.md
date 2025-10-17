# HP Printer E-commerce Platform

A full-stack e-commerce platform for HP printers and accessories, built with React.js frontend and Node.js/Express backend with MySQL database.

## 🚀 Features

### Frontend (React.js)
- **Modern UI/UX**: Responsive design with beautiful animations
- **Product Catalog**: Browse and search HP printers and accessories
- **Shopping Cart**: Add, update, and manage cart items
- **User Authentication**: Login, registration, and profile management
- **Product Reviews**: Rate and review products
- **Support System**: Create and track support tickets
- **Order Management**: View order history and track orders

### Backend (Node.js/Express)
- **RESTful API**: Well-structured API endpoints
- **User Management**: Authentication, authorization, and profile management
- **Product Catalog Service**: Product CRUD operations and inventory management
- **Shopping Cart Service**: Session-based cart management
- **Order Management**: Order processing and tracking
- **Reviews & Ratings**: Product review system
- **Support System**: Customer support ticket management
- **Email Integration**: Password reset and order confirmations
- **Security**: JWT authentication, rate limiting, input validation

### Database (MySQL)
- **Comprehensive Schema**: Users, products, orders, reviews, support tickets
- **Relationships**: Proper foreign key relationships
- **Indexing**: Optimized for performance
- **Data Integrity**: Constraints and validations

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Context API** - State management
- **CSS3** - Styling with animations
- **Axios/Fetch** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd e-comm
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
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

### 3. Database Setup
```bash
# Create database using the schema
mysql -u root -p < db/schema.sql

# Seed the database with sample data
cd backend
npm run seed
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### 5. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🔐 Default Credentials

After seeding the database:
- **Admin**: admin@hpprinters.com / admin123
- **Customer**: john@example.com / customer123

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset

### Product Endpoints
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/search/:query` - Search products
- `GET /api/products/featured/list` - Get featured products
- `GET /api/products/categories/list` - Get categories

### Cart Endpoints
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item
- `DELETE /api/cart/clear` - Clear cart

### Order Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/cancel` - Cancel order

### Review Endpoints
- `POST /api/reviews/:productId` - Add review
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/user/my-reviews` - Get user reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Support Endpoints
- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get user tickets
- `GET /api/support/tickets/:id` - Get ticket by ID
- `GET /api/support/knowledge-base/search` - Search knowledge base

## 🗄️ Database Schema

### Main Tables
- **users** - User accounts and authentication
- **addresses** - User shipping/billing addresses
- **categories** - Product categories
- **products** - Product catalog
- **product_images** - Product images
- **inventory_movements** - Stock tracking
- **carts** & **cart_items** - Shopping cart
- **orders** & **order_items** - Order management
- **payments** - Payment records
- **shipping** - Shipping tracking
- **reviews** - Product reviews
- **support_tickets** - Customer support
- **coupons** - Discount codes

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Use PM2 for process management
3. Set up reverse proxy with Nginx
4. Configure SSL certificates

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Configure environment variables

### Database Deployment
1. Set up MySQL on cloud provider
2. Configure backups
3. Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, email support@hpprinters.com or create a support ticket in the application.

## 🎯 Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Real-time notifications
- [ ] Advanced search with filters
- [ ] Wishlist functionality
- [ ] Product comparison
- [ ] Mobile app
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Inventory management system



..........................................................
