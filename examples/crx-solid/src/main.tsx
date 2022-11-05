/* @refresh reload */
import { render } from 'solid-js/web';

import './assets/css/index.css';
import App from './App';

render(() => <App />, document.getElementById('app') as HTMLElement);
