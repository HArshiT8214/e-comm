import React, { useState, useEffect } from 'react'
import './Navbar.css'
import logo from '../Assets/logo.png'
import cart from '../Assets/cart-icon.jpg'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function Navbar() {
    const [menu, setMenu] = useState("Shop-hp-store");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { items } = useCart();
    const { user, logout, isAuthenticated } = useAuth();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Update active menu based on current location
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') setMenu("Shop-hp-store");
        else if (path === '/support') setMenu("support");
    }, [location]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
        closeMobileMenu();
        navigate('/');
    };

    const handleUserMenuToggle = () => {
        setShowUserMenu(!showUserMenu);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <div className="nav-logo">
                    <Link to="/" onClick={closeMobileMenu}>
                        <img src={logo} alt="Logo" />
                        <span>HP Printer Store</span>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="mobile-menu-btn" onClick={toggleMobileMenu}>
                    <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}></span>
                    <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}></span>
                    <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}></span>
                </div>

                {/* Desktop Navigation Menu */}
                <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <li className={menu === "Shop-hp-store" ? 'active' : ''}>
                        <Link to='/' onClick={closeMobileMenu}>
                            <span>Shop</span>
                            {menu === "Shop-hp-store" && <div className="active-indicator"></div>}
                        </Link>
                    </li>
                    <li className={menu === "support" ? 'active' : ''}>
                        <Link to='/support' onClick={closeMobileMenu}>
                            <span>Support</span>
                            {menu === "support" && <div className="active-indicator"></div>}
                        </Link>
                    </li>
                </ul>
                
                <form className="nav-search-box" onSubmit={handleSearch}>
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="nav-search-btn" aria-label="Search">🔍</button>
                </form>

                <div className='nav-actions'>
                    {isAuthenticated ? (
                        <div className="user-menu-container">
                            <button className="user-menu-btn" onClick={handleUserMenuToggle}>
                                <div className="user-avatar">
                                    {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                                </div>
                                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            
                            {showUserMenu && (
                                <div className="user-menu">
                                    <Link to="/profile" onClick={() => { setShowUserMenu(false); closeMobileMenu(); }}>
                                        <span>Profile</span>
                                    </Link>
                                    <Link to="/orders" onClick={() => { setShowUserMenu(false); closeMobileMenu(); }}>
                                        <span>My Orders</span>
                                    </Link>
                                    <Link to="/reviews" onClick={() => { setShowUserMenu(false); closeMobileMenu(); }}>
                                        <span>My Reviews</span>
                                    </Link>
                                    <button onClick={handleLogout} className="logout-btn">
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" onClick={closeMobileMenu}>
                                <button className="btn-login">Login</button>
                            </Link>
                            <Link to="/signup" onClick={closeMobileMenu}>
                                <button className="btn-signup">Sign Up</button>
                            </Link>
                        </div>
                    )}
                    
                    <div className="cart-container">
                        <Link to="/cart" onClick={closeMobileMenu}>
                            <div className="cart-icon">
                                <img src={cart} alt="Cart" />
                                <div className="cart-count">{items.reduce((n,i)=>n+i.quantity,0)}</div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
