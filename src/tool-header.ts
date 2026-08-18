import {Dispatch} from 'redux';
import {SET_APPLICATION_STATE} from './actions';
import {t} from './i18n';
import {fromSerializable, State} from './models/index';
import {ProjectLoadMeta, rememberProjectLoad} from './project-state';

export type ToolHeaderElement = HTMLElement & {
  __dvzNativeProjectProcessingToasts?: string;
  __dvzProcessingToastsInstalled?: string;
  showMessage?: (message: string, type?: string, duration?: number) => void;
  showLoadModal?: (...args: any[]) => any;
  loadProject?: (...args: any[]) => any;
  saveProject?: (...args: any[]) => any;
  showSaveModal?: (payload: any) => any;
  setConfig?: (config: any) => void;
  setProjectConfig?: (config: any) => void;
  setSampleConfig?: (config: any) => void;
};

export function getToolHeader(): ToolHeaderElement | null {
  return document.querySelector('dataviz-tool-header') as ToolHeaderElement | null;
}

export function showProcessingToast(message: string, duration = 5000) {
  const header = getToolHeader();
  if (header && typeof header.showMessage === 'function') {
    header.showMessage(message, 'info', duration);
  }
}

export function installHeaderProcessingToasts(header: ToolHeaderElement | null) {
  if (
    !header ||
    header.__dvzNativeProjectProcessingToasts === '1' ||
    header.__dvzProcessingToastsInstalled === '1'
  ) {
    return;
  }

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

export function applyProjectPayload(dispatch: Dispatch<State>, projectData: any, meta?: ProjectLoadMeta) {
  const projectPayload = rememberProjectLoad(projectData, meta);
  const newState = fromSerializable(projectPayload);

  dispatch({
    type: SET_APPLICATION_STATE,
    payload: {
      state: newState
    }
  });
}

export const OPEN_DATA_SELECTOR_EVENT = 'voyager:open-data-selector';

export function openDataSelector() {
  if (typeof document === 'undefined') {
    return;
  }
  document.dispatchEvent(new CustomEvent(OPEN_DATA_SELECTOR_EVENT));
}
