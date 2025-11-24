import React from 'react';
const HOME_URL = import.meta.env?.VITE_HOME_URL || 'http://localhost:8080/';

const Header = () => {
  return (
    <header className="site-header">
      <div className="container">
        <div className="brand">
          <span className="logo">◎</span>
          <span className="title">中国铁路12306</span>
        </div>
        <nav className="nav">
          <a href={HOME_URL}>首页</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;