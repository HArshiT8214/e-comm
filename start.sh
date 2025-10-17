#!/bin/bash

echo "�� Starting HP Printer E-commerce Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Dependencies installed successfully!"

echo "🔧 Setting up environment files..."

# Create backend .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your database credentials"
fi

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_API_BASE_URL=http://localhost:3001/api" > frontend/.env
fi

echo "✅ Environment files created!"

echo "🗄️  Setting up database..."
echo "Please run the following commands to set up the database:"
echo "1. mysql -u root -p < db/schema.sql"
echo "2. cd backend && npm run seed"

echo ""
echo "🎉 Setup complete! To start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo ""
echo "Default credentials after seeding:"
echo "- Admin: admin@hpprinters.com / admin123"
echo "- Customer: john@example.com / customer123"
