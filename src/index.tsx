import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import 'font-awesome-sass-loader';

import {Data} from 'vega-lite/build/src/data';
import {App} from './components/app';
import {VOYAGER_CONFIG} from './constants';
import {VoyagerConfig} from './models/config';
import {configureStore} from './store';

import {datasetLoad, SET_APPLICATION_STATE} from './actions';
import {toSerializable, fromSerializable} from './models/index';
import {t} from './i18n';

const store = configureStore();
const config: VoyagerConfig = VOYAGER_CONFIG;

const data: Data = undefined;

// Project management state
let currentProjectId: string | null = null;
let currentProjectName: string | null = null;

// Get data filename without extension
function getDataFilename(): string | null {
  try {
    const state = store.getState();
    if (state && (state as any).dataset && (state as any).dataset.name) {
      const filename = (state as any).dataset.name;
      // Remove extension if present
      return filename.replace(/\.[^/.]+$/, '');
    }
  } catch (err) {
    console.error('Failed to get data filename:', err);
  }
  return null;
}

// Get thumbnail from canvas
function getThumbnailDataUri(): string | null {
  try {
    const headers = document.getElementsByTagName('h2');
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].textContent === t('viewPane.specifiedView')) {
        const parent = headers[i].parentElement;
        if (parent) {
          const canvas = parent.querySelector('canvas') as HTMLCanvasElement;
          if (canvas) return canvas.toDataURL('image/png');
        }
        break;
      }
    }
  } catch (err) {
    console.error('Failed to capture thumbnail:', err);
  }
  return null;
}

function showProcessingToast(message: string) {
  const header = document.querySelector('dataviz-tool-header');
  if (header && typeof (header as any).showMessage === 'function') {
    (header as any).showMessage(message, 'info', 5000);
  }
}

function installHeaderProcessingToasts(header: any) {
  if (!header || header.__dvzNativeProjectProcessingToasts === '1' || header.__dvzProcessingToastsInstalled === '1') return;

  if (typeof header.showLoadModal === 'function') {
    const originalShowLoadModal = header.showLoadModal.bind(header);
    header.showLoadModal = (...args: any[]) => {
      showProcessingToast(t('processing.projectList'));
      return originalShowLoadModal(...args);
    };
  }

  if (typeof header.loadProject === 'function') {
    const originalLoadProject = header.loadProject.bind(header);
    header.loadProject = (...args: any[]) => {
      showProcessingToast(t('processing.projectLoad'));
      return originalLoadProject(...args);
    };
  }

  if (typeof header.saveProject === 'function') {
    const originalSaveProject = header.saveProject.bind(header);
    header.saveProject = (...args: any[]) => {
      showProcessingToast(t('processing.projectSave'));
      return originalSaveProject(...args);
    };
  }

  header.__dvzProcessingToastsInstalled = '1';
}

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
    installHeaderProcessingToasts(header);

    // Measure and update tool header height CSS variable
    requestAnimationFrame(() => {
      const rect = header.getBoundingClientRect();
      if (rect.height > 0) {
        document.documentElement.style.setProperty('--tool-header-height', rect.height + 'px');
      }
    });

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
            (header as any).showLoadModal();
          },
          align: 'right'
        },
        {
          label: 'プロジェクトの保存',
          action: () => {
            showProcessingToast(t('processing.savePrep'));
            const state = store.getState();
            const serializableState = toSerializable(state);
            // Use data filename as default, fallback to previous project name or timestamp
            const defaultName = getDataFilename() || currentProjectName;
            const now = new Date();
            const pad = (n: number) => ('0' + n).slice(-2);
            const fallbackName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            (header as any).showSaveModal({
              name: defaultName || fallbackName,
              data: serializableState,
              thumbnailDataUri: getThumbnailDataUri(),
              existingProjectId: currentProjectId,
            });
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
      ]
    });

    // Configure project management
    (header as any).setProjectConfig({
      appName: 'voyager2',
      onProjectLoad: (projectData: any) => {
        try {
          const newState = fromSerializable(projectData);
          store.dispatch({
            type: SET_APPLICATION_STATE,
            payload: { state: newState }
          });
        } catch (e) {
          console.error('Failed to apply project data:', e);
        }
      },
      onProjectSave: (meta: { id: string; name: string }) => {
        currentProjectId = meta.id;
        if (meta.name) currentProjectName = meta.name;
      }
    });

    // Sample data picker integration
    (header as any).setSampleConfig({
      toolId: 'voyager2',
      onSampleSelect: (detail: { url: string; format: string; name: string }) => {
        showProcessingToast(t('processing.sample'));
        store.dispatch(datasetLoad(detail.name, { url: detail.url } as Data));
      }
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
