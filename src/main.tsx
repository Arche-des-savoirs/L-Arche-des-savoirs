import { render } from 'preact';
import { App } from './ui/App';
import { setupPWA } from './pwa';
import './styles.css';

setupPWA();
render(<App />, document.getElementById('app')!);
