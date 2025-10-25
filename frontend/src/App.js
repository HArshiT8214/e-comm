import './App.css';
import Navbar from './components/navbar/Navbar'
import Footer from './components/footer/Footer'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Shop from './pages/shop'
import ProductDetail from './pages/ProductDetail';
import SearchResults from './pages/SearchResults';
import Support from './pages/support';
import Login from './pages/login';
import Signup from './pages/signup';
import ForgotPassword from './pages/forgot-password';
import Cart from './pages/cart';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path='/' element={<Shop />}></Route>
                <Route path='/product/:id' element={<ProductDetail />}></Route>
                <Route path='/search' element={<SearchResults />}></Route>
                <Route path='/support' element={<Support />}></Route>
                <Route path='/login' element={<Login />}></Route>
                <Route path='/signup' element={<Signup />}></Route>
                <Route path='/forgot-password' element={<ForgotPassword />}></Route>
                <Route path='/cart' element={<Cart />}></Route>
                <Route path='/profile' element={<UserProfile />}></Route>
                <Route path='/admin/login' element={<AdminLogin />}></Route>
                <Route path='/admin/*' element={<AdminDashboard />}></Route>
              </Routes>
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
