import {SET_APPLICATION_STATE} from './actions';
import {DEFAULT_STATE, toSerializable} from './models/index';
import {clearCurrentProjectMeta, getCurrentProjectMeta} from './project-state';
import {
  applyProjectPayload,
  getToolHeader,
  installHeaderProcessingToasts,
  OPEN_DATA_SELECTOR_EVENT,
  openDataSelector,
  showProcessingToast,
  ToolHeaderElement
} from './tool-header';

function createHeader(overrides: Partial<ToolHeaderElement> = {}): ToolHeaderElement {
  const header = document.createElement('dataviz-tool-header') as ToolHeaderElement;
  header.showMessage = jest.fn();
  header.showLoadModal = jest.fn();
  header.loadProject = jest.fn();
  header.saveProject = jest.fn();
  Object.keys(overrides).forEach(key => {
    (header as any)[key] = (overrides as any)[key];
  });
  document.body.appendChild(header);
  return header;
}

describe('tool-header', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    clearCurrentProjectMeta();
  });

  it('finds the tool header element', () => {
    const header = createHeader();
    expect(getToolHeader()).toBe(header);
  });

  it('shows a processing toast on the tool header', () => {
    const header = createHeader();
    showProcessingToast('保存準備中です');
    expect(header.showMessage).toBeCalledWith('保存準備中です', 'info', 5000);
  });

  it('wraps project APIs once when native toasts are missing', () => {
    const showLoadModal = jest.fn();
    const loadProject = jest.fn();
    const saveProject = jest.fn();
    const header = createHeader({showLoadModal, loadProject, saveProject});

    installHeaderProcessingToasts(header);
    installHeaderProcessingToasts(header);

    header.showLoadModal();
    header.loadProject('project-123');
    header.saveProject({name: 'Saved'});

    expect(showLoadModal).toHaveBeenCalledTimes(1);
    expect(loadProject).toBeCalledWith('project-123');
    expect(saveProject).toBeCalledWith({name: 'Saved'});
    expect(header.showMessage).toHaveBeenCalledTimes(3);
    expect(header.__dvzProcessingToastsInstalled).toEqual('1');
  });

  it('does not wrap project APIs when native toasts are present', () => {
    const showLoadModal = jest.fn();
    const header = createHeader({
      showLoadModal,
      __dvzNativeProjectProcessingToasts: '1'
    });

    installHeaderProcessingToasts(header);
    header.showLoadModal();

    expect(showLoadModal).toHaveBeenCalledTimes(1);
    expect(header.showMessage).not.toBeCalled();
    expect(header.__dvzProcessingToastsInstalled).toBeUndefined();
  });

  it('applies a project payload to the store', () => {
    const dispatched: any[] = [];
    const serializable = toSerializable(DEFAULT_STATE);

    applyProjectPayload(((action: any) => dispatched.push(action)) as any, serializable, {
      projectId: 'project-123',
      projectName: 'Saved project'
    });

    expect(dispatched.length).toEqual(1);
    expect(dispatched[0].type).toEqual(SET_APPLICATION_STATE);
    expect(getCurrentProjectMeta()).toEqual({
      id: 'project-123',
      name: 'Saved project',
      thumbnailDataUri: null
    });
  });

  it('opens the data selector with a document event', () => {
    const listener = jest.fn();
    document.addEventListener(OPEN_DATA_SELECTOR_EVENT, listener);

    openDataSelector();

    expect(listener).toHaveBeenCalledTimes(1);
    document.removeEventListener(OPEN_DATA_SELECTOR_EVENT, listener);
  });
});
