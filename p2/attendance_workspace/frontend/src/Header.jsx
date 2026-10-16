import React from 'react';

function Header({ title }) {
  return (
    <header style={{ borderBottom: '2px solid #eee', marginBottom: '20px', paddingBottom: '10px' }}>
      <h1 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>{title}</h1>
      <small style={{ color: '#27ae60', fontWeight: 'bold' }}>● System Status: Synchronized</small>
    </header>
  );
}

export default Header;
