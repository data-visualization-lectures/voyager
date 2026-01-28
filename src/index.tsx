import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import 'font-awesome-sass-loader';

import {Data} from 'vega-lite/build/src/data';
import {App} from './components/app';
import {VOYAGER_CONFIG} from './constants';
import {VoyagerConfig} from './models/config';
import {configureStore} from './store';

import {datasetLoad} from './actions';
import {DEFAULT_DATASETS} from './constants';

const store = configureStore();
const config: VoyagerConfig = VOYAGER_CONFIG;

const data: Data = undefined;

ReactDOM.render(
  <Provider store={store}>
    <App
      config={config}
      data={data}
      dispatch={store.dispatch}
    />
  </Provider>,
  document.getElementById('root')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/app', () => {
    const NextApp = require('./components/app').App;
    ReactDOM.render(
      <Provider store={store}>
        <NextApp
          config={config}
          data={data}
          dispatch={store.dispatch}
        />
      </Provider>,
      document.getElementById('root')
    );
  });
}

// Configure Tool Header
customElements.whenDefined('dataviz-tool-header').then(() => {
  const header = document.querySelector('dataviz-tool-header');
  if (header) {
    (header as any).setConfig({
      logo: {
        type: 'image',
        src: '/static/media/logo.2773f11a.png',
        alt: 'Voyager 2'
      },
      buttons: [
        {
          label: 'プロジェクトの読込',
          action: () => {
            // Trigger the load button click in the original header
            const loadButton = document.getElementById('voyager-cmd-load') as HTMLButtonElement;
            if (loadButton) {
              loadButton.click();
            }
          },
          align: 'right'
        },
        {
          label: 'プロジェクトの保存',
          action: () => {
            // Trigger the save button click in the original header
            const saveButton = document.getElementById('voyager-cmd-save') as HTMLButtonElement;
            if (saveButton) {
              saveButton.click();
            }
          },
          align: 'right'
        },
        {
          label: 'データファイルの読込',
          action: () => {
            // Trigger the original data selector button
            const dataSelectorBtn = document.querySelector('span[class*="data-selector"] button') as HTMLButtonElement;
            if (dataSelectorBtn) {
              dataSelectorBtn.click();
            }
          },
          align: 'left'
        },
        {
          label: 'サンプルデータの読込',
          type: 'dropdown',
          width: 150,
          items: DEFAULT_DATASETS.map(d => ({
            label: d.name,
            action: () => {
              store.dispatch(datasetLoad(d.name, d as any));
            }
          })),
          align: 'left'
        }
      ]
    });
  }
});

// Hide original header and data selector via JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const hideElements = () => {
    // Hide original header
    const headers = document.querySelectorAll('div[class*="header__header"]');
    for (let i = 0; i < headers.length; i++) {
      (headers[i] as HTMLElement).style.display = 'none';
    }

    // Hide original data selector button/container
    const dataSelectors = document.querySelectorAll('span[class*="data-selector"]');
    for (let i = 0; i < dataSelectors.length; i++) {
      // Hide ONLY the button, not the modal content if it is appended to body (though usually modal is separate)
      // The data selector component wraps the button.
      (dataSelectors[i] as HTMLElement).style.display = 'none';
    }
  };

  hideElements();
  // Also try after a short delay in case React renders later
  setTimeout(hideElements, 100);
  setTimeout(hideElements, 500);
  setTimeout(hideElements, 1000);
});
