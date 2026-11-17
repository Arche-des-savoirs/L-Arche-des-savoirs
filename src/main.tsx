import { render } from 'preact';
import { App } from './ui/App';
import { setupPWA } from './pwa';
// Polices embarquées (licence OFL), précachées : disponibles hors ligne.
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import './styles.css';

setupPWA();
render(<App />, document.getElementById('app')!);
