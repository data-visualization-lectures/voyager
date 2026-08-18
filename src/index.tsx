import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import 'font-awesome-sass-loader';

import {Data} from 'vega-lite/build/src/data';
import {datasetLoad} from './actions';
import {App} from './components/app';
import {VOYAGER_CONFIG} from './constants';
import {t} from './i18n';
import {VoyagerConfig} from './models/config';
import {toSerializable} from './models/index';
import {
  attachThumbnailDataUri,
  extractThumbnailDataUri,
  getCurrentProjectMeta,
  rememberProjectSave,
  rememberProjectThumbnail
} from './project-state';
import {configureStore} from './store';
import {getThumbnailDataUri} from './thumbnail';
import {
  applyProjectPayload,
  getToolHeader,
  installHeaderProcessingToasts,
  openDataSelector,
  showProcessingToast
} from './tool-header';

const store = configureStore();
const config: VoyagerConfig = VOYAGER_CONFIG;

const data: Data = undefined;

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
  const header = getToolHeader();
  if (header) {
    installHeaderProcessingToasts(header);

    // Measure and update tool header height CSS variable
    requestAnimationFrame(() => {
      const rect = header.getBoundingClientRect();
      if (rect.height > 0) {
        document.documentElement.style.setProperty('--tool-header-height', rect.height + 'px');
      }
    });

    header.setConfig({
      logo: {
        type: 'image',
        src: '/static/media/logo.2773f11a.png',
        alt: 'Voyager 2'
      },
      buttons: [
        {
          label: 'プロジェクトの読込',
          action: () => {
            if (typeof header.showLoadModal === 'function') {
              header.showLoadModal();
            }
          },
          align: 'right'
        },
        {
          label: 'プロジェクトの保存',
          action: async () => {
            showProcessingToast(t('processing.savePrep'));
            const state = store.getState();
            const serializableState = toSerializable(state);
            const projectMeta = getCurrentProjectMeta();
            const thumbnailDataUri =
              await getThumbnailDataUri() ||
              extractThumbnailDataUri(serializableState) ||
              projectMeta.thumbnailDataUri;
            attachThumbnailDataUri(serializableState, thumbnailDataUri);
            rememberProjectThumbnail(thumbnailDataUri);
            // Use data filename as default, fallback to previous project name or timestamp
            const defaultName = getDataFilename() || projectMeta.name;
            const now = new Date();
            const pad = (n: number) => ('0' + n).slice(-2);
            const fallbackName = [
              `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
              `${pad(now.getHours())}:${pad(now.getMinutes())}`
            ].join(' ');
            if (typeof header.showSaveModal === 'function') {
              header.showSaveModal({
                name: defaultName || fallbackName,
                data: serializableState,
                thumbnailDataUri,
                existingProjectId: projectMeta.id,
              });
            }
          },
          align: 'right'
        },
        {
          label: 'データファイルの読込',
          action: () => {
            openDataSelector();
          },
          align: 'left'
        },
      ]
    });

    header.setProjectConfig({
      appName: 'voyager2',
      onProjectLoad: (projectData: any, meta?: any) => {
        try {
          applyProjectPayload(store.dispatch, projectData, meta);
        } catch (e) {
          console.error('Failed to apply project data:', e);
        }
      },
      onProjectSave: (meta: { id: string; name: string }) => {
        rememberProjectSave(meta, getCurrentProjectMeta().thumbnailDataUri);
      }
    });

    header.setSampleConfig({
      toolId: 'voyager2',
      onSampleSelect: (detail: { url: string; format: string; name: string }) => {
        showProcessingToast(t('processing.sample'));
        store.dispatch(datasetLoad(detail.name, { url: detail.url } as Data));
      }
    });
  }
});
