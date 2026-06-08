import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-spidhive-white text-spidhive-black">
      <h1 className="text-4xl font-bold text-spidhive-maroon mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-6">The page you're looking for doesn't exist.</p>
      <Link 
        to="/" 
        className="px-4 py-2 bg-spidhive-maroon text-white rounded hover:bg-spidhive-maroon/90"
      >
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
