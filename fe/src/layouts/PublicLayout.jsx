import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import './PublicLayout.scss';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      <Header isPublic={true} />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PublicLayout;
