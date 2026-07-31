import React from 'react';
import ReactDOM from 'react-dom/client';

import '@web/index.css'; 
import WebApp from '@web/App'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>
);