import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { logo } from './assets';
import { Home, CreatePost } from './page';
import { DarkModeToggle } from './components';
import { ThemeProvider } from './context/ThemeContext';

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <header className="w-full flex justify-between items-center bg-white dark:bg-secondary-dark sm:px-8 px-4 py-4 border-b border-border-light dark:border-border-dark transition-colors duration-200">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="logo" className="w-28 object-contain" />
        </Link>

        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <Link 
            to="/create-post" 
            className="font-inter font-medium bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Create
          </Link>
        </div>
      </header>
      <main className="sm:p-8 px-4 py-8 w-full bg-secondary dark:bg-secondary-dark min-h-[calc(100vh-73px)] transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-post" element={<CreatePost />} />
        </Routes>
      </main>
      <footer className="w-full bg-white dark:bg-secondary-dark text-text-secondary dark:text-text-secondary-dark text-center py-4 border-t border-border-light dark:border-border-dark text-sm transition-colors duration-200">
        <p> {new Date().getFullYear()} DALL-E Clone. All rights reserved.</p>
      </footer>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;