import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import * as vega from 'vega';

import * as styles from './data-selector.scss';

import {
  ActionHandler,
  createDispatchHandler,
  DatasetAsyncAction,
  datasetLoad,
} from '../../actions';
import { t } from '../../i18n';
import { Dataset, State } from '../../models';
import { selectDataset } from '../../selectors';
import { OPEN_DATA_SELECTOR_EVENT } from '../../tool-header';

export interface DataSelectorOwnProps {
  title: string;
}

export interface DataSelectorConnectProps {
  data: Dataset;
}

export type DataSelectorProps = DataSelectorConnectProps & DataSelectorOwnProps & ActionHandler<DatasetAsyncAction>;

export interface DataSelectorState {
  modalIsOpen: boolean;
  dataText: string;
  dataName: string;
  dataUrl: string;
  fileType: string;
}

export class DataSelectorBase extends React.PureComponent<DataSelectorProps, DataSelectorState> {

  constructor(props: DataSelectorProps) {
    super(props);

    this.state = { modalIsOpen: false, dataText: '', dataName: '', dataUrl: '', fileType: undefined };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
    this.onDataTextSubmit = this.onDataTextSubmit.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleFileTypeChange = this.handleFileTypeChange.bind(this);
    this.onDataUrlSubmit = this.onDataUrlSubmit.bind(this);
  }

  public componentDidMount() {
    document.addEventListener(OPEN_DATA_SELECTOR_EVENT, this.openModal);
  }

  public componentWillUnmount() {
    document.removeEventListener(OPEN_DATA_SELECTOR_EVENT, this.openModal);
  }

  public render() {
    const { title } = this.props;

    return (
      <span styleName='data-selector'>
        <button onClick={this.openModal}>{title}</button>
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          contentLabel="Data Selector"
          styleName="modal"
        >
          <div className='modal-header'>
            <a styleName='modal-close' onClick={this.closeModal}>{t('dataSelector.close')}</a>
            <h3>{t('dataSelector.addDataset')}</h3>
          </div>
          <Tabs className={styles['react-tabs']}>
            <TabList className={styles['tab-list']}>
              <Tab className={styles.tab}>{t('dataSelector.pasteOrUpload')}</Tab>
              <Tab className={styles.tab}>{t('dataSelector.fromUrl')}</Tab>
            </TabList>
            <TabPanel className={styles['tab-panel']}>
              <div>
                {this.renderUploadPanel()}
                {this.renderPastePanel()}
              </div>
            </TabPanel>
            <TabPanel className={styles['tab-panel']}>
              {this.renderUrlPanel()}
            </TabPanel>
          </Tabs>
        </Modal>
      </span>
    );
  }

  private renderUploadPanel() {
    return (
      <div styleName='upload-panel'>
        <div className='form-group'>
          <label htmlFor='data-file'>{t('dataSelector.file')}</label>
          <input id='data-file' type='file' onChange={this.onFileChange} />
        </div>
        <p>{t('dataSelector.uploadInstructions')}</p>
        <div styleName='dropzone-target' />
      </div>
    );
  }

  private renderUrlPanel() {
    return (
      <div styleName='url-panel'>
        <p dangerouslySetInnerHTML={{__html: t('dataSelector.urlInstructions')}} />
        <div className='form-group'>
          <label htmlFor='filetype-selector'>{t('dataSelector.fileType')}</label>
          <select value={this.state.fileType} onChange={this.handleFileTypeChange} id='filetype-selector'>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="tsv">TSV</option>
          </select>
        </div>
        <div className='form-group'>
          <label htmlFor='data-name'>{t('dataSelector.name')}</label>
          <input
            name='dataName'
            value={this.state.dataName}
            onChange={this.handleTextChange}
            id='data-name'
            type='name'
          />
        </div>
        <div className='form-group'>
          <label htmlFor='data-url'>{t('dataSelector.url')}</label>
          <input
            name='dataUrl'
            value={this.state.dataUrl}
            onChange={this.handleTextChange}
            id='data-url'
            type='name'
          />
        </div>
        <button onClick={this.onDataUrlSubmit}>{t('dataSelector.addDatasetButton')}</button>
      </div>
    );
  }

  private handleFileTypeChange(event: any) {
    this.setState({ fileType: event.target.value });
  }

  private renderPastePanel() {
    return (
      <div styleName='paste-panel'>
        <div className='form-group'>
          <label htmlFor='data-name'>{t('dataSelector.name')}</label>
          <input
            name='dataName'
            value={this.state.dataName}
            onChange={this.handleTextChange}
            id='data-name'
            type='name'
          />
        </div>
        <div className='form-group'>
          <textarea
            name='dataText'
            value={this.state.dataText}
            onChange={this.handleTextChange}
          />
        </div>
        <button onClick={this.onDataTextSubmit}>{t('dataSelector.addData')}</button>
      </div>
    );
  }

  private onFileChange(event: any) {
    const { handleAction } = this.props;
    const reader = new FileReader();

    const file = event.target.files[0];

    reader.onload = (lEvent: any) => {
      const name = file.name.replace(/\.\w+$/, '');
      const format = file.name.split('.').pop();
      const buffer = lEvent.target.result as ArrayBuffer;

      // UTF-8でデコードを試行し、失敗したらShift_JISにフォールバック
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder('shift_jis').decode(buffer);
      }

      let values;
      try {
        values = vega.read(text, { type: format });
      } catch (err) {
        window.alert(err.message);
      }

      handleAction(datasetLoad(name, { values, format }));
    };

    reader.readAsArrayBuffer(file);
  }

  private onDataTextSubmit() {
    const values = vega.read(this.state.dataText, { type: 'csv' });
    this.props.handleAction(datasetLoad(this.state.dataName, { values }));
  }

  private loadDataString(data: string) {
    const name = this.state.dataName;
    const fileType = this.state.fileType;
    const values = vega.read(data, { type: fileType });
    this.props.handleAction(datasetLoad(name, { values }));
  }

  private onDataUrlSubmit() {
    const loader = vega.loader();
    loader.load(this.state.dataUrl).then(data => {
      this.loadDataString(data);
    }).catch(error => {
      console.warn('Error occurred while loading data: ', error);
    });
  }

  private openModal() {
    this.setState({ modalIsOpen: true });
  }

  private closeModal() {
    this.setState({ modalIsOpen: false });
  }

  // https://facebook.github.io/react/docs/forms.html
  private handleTextChange(event: any) {
    const name = event.target.name;
    this.setState({ [name]: event.target.value });
  }
}

const DataSelectorRenderer = CSSModules(DataSelectorBase, styles);

export const DataSelector = connect<DataSelectorConnectProps, ActionHandler<DatasetAsyncAction>, DataSelectorOwnProps>(
  (state: State) => {
    return {
      data: selectDataset(state)
    };
  },
  createDispatchHandler<DatasetAsyncAction>()
)(DataSelectorRenderer);
