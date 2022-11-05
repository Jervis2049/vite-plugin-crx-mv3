/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';


window.onload = async () => {
    const el = document.querySelector('body');
    if (el) {
      el.insertAdjacentHTML(
        'afterend',
        '<div id="crx-app"></div>',
      );
      render(() => <App />, document.getElementById('crx-app') as HTMLElement);
    }
}
  