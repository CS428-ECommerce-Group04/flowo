import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-700 hover:text-green-800 transition-colors duration-200"
          >
            Flowo
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            {/* Shop Link */}
            <Link 
              to="/shop" 
              className="text-base sm:text-lg lg:text-xl font-medium text-slate-600 hover:text-green-700 transition-colors duration-200 hidden sm:block"
            >
              Shop
            </Link>

            {/* Mobile Shop Link */}
            <Link 
              to="/shop" 
              className="text-sm font-medium text-slate-600 hover:text-green-700 transition-colors duration-200 sm:hidden"
            >
              Shop
            </Link>

            {/* Shopping Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 sm:p-3 lg:p-4 hover:bg-slate-100 rounded-full transition-colors duration-200 group"
              aria-label="Shopping Cart"
            >
              <div className="text-xl sm:text-2xl lg:text-3xl text-slate-600 group-hover:text-green-700 transition-colors duration-200">
                🛒
              </div>
              {/* Optional: Cart item count badge */}
              {/* <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span> */}
            </Link>

            {/* Menu Icon */}
            <button 
              className="p-2 sm:p-3 lg:p-4 hover:bg-slate-100 rounded-full transition-colors duration-200 group"
              aria-label="Menu"
              onClick={() => {
                // Add menu functionality here
                console.log('Menu clicked');
              }}
            >
              <div className="flex flex-col space-y-1 sm:space-y-1.5">
                <div className="w-5 sm:w-6 lg:w-7 h-0.5 sm:h-1 bg-slate-600 group-hover:bg-green-700 transition-colors duration-200 rounded-full"></div>
                <div className="w-5 sm:w-6 lg:w-7 h-0.5 sm:h-1 bg-slate-600 group-hover:bg-green-700 transition-colors duration-200 rounded-full"></div>
                <div className="w-5 sm:w-6 lg:w-7 h-0.5 sm:h-1 bg-slate-600 group-hover:bg-green-700 transition-colors duration-200 rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
