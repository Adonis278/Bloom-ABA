import React from 'react';
import { createRoot } from 'react-dom/client';

/* Fonts are self-hosted, not loaded from a CDN.
   A Google Fonts request would ship a minor's IP address to a third party on
   every page load. Hard rule 8: no third-party tracking, and its absence is a
   stated product feature.

   Atkinson Hyperlegible — Braille Institute, designed to differentiate
   easily-confused characters. Chosen for the subject, not for style. */
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource/atkinson-hyperlegible/700.css';

/* IBM Plex Mono — adult dashboard only. Loaded here so the token layer is
   complete; nothing on the student surface uses it. */
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
