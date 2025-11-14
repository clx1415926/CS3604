import React from 'react';

const Header = () => {
  return (
    <header className="site-header">
      <div className="container">
        <div className="brand">
          <span className="logo">◎</span>
          <span className="title">中国铁路12306</span>
        </div>
        <nav className="nav">
          <a href="#">首页</a>
          <a href="#">客运首页</a>
          <a href="#" className="active">车票</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;