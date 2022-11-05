import type { Component } from 'solid-js';

import './assets/css/content.css';

function handleClick() {
  alert('This is a fun Chrome extension.')
}

const App: Component = () => {
  return (
    <div class="button" onClick={handleClick}></div>
  );
};

export default App;
