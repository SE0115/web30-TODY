import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import App from './App';
import '@styles/reset.css';
import '@styles/index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </React.StrictMode>,
);
