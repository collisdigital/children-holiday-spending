import React from 'react';
import { Link } from 'react-router-dom';
import { Umbrella } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex items-center">
        <Link to="/" className="flex items-center gap-3 text-primary hover:text-primary-dark transition-colors">
          <div className="bg-yellow-100 p-2 rounded-full">
            <Umbrella className="w-6 h-6 text-yellow-500" />
          </div>
          <span className="text-xl font-bold">Holiday Spending</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
