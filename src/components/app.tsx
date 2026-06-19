
import * as React from 'react';
import {Dispatch} from 'redux';
import {ActionCreators} from 'redux-undo';
import {Data} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec, TopLevel} from 'vega-lite/build/src/spec';
import {datasetLoad, SET_APPLICATION_STATE, SET_CONFIG} from '../actions';
import {SPEC_LOAD} from '../actions/shelf';
import {VoyagerConfig} from '../models/config';
import {fromSerializable, State} from '../models/index';
import {t} from '../i18n';
import {AppRoot} from './app-root';

export interface Props extends React.Props<App> {
  config?: VoyagerConfig;
  data?: Data;
  applicationState?: Readonly<State>;
  spec?: TopLevel<FacetedCompositeUnitSpec>;
  filename?: string;
  dispatch: Dispatch<State>;
}

export class App extends React.PureComponent<Props, {}> {

  constructor(props: any) {
    super(props);
  }

  public componentWillUpdate(nextProps: Props) {
    this.update(nextProps);
  }

  public componentWillMount() {
    // Clear history as redux-undo seems to always put the first action after
    // an init into the history. This ensures we start with a fresh history once
    // the app is about to start.
    this.props.dispatch(ActionCreators.clearHistory());
    this.update(this.props);
  }

  // Flag to prevent duplicate loading
  private isLoadingProject = false;

  private showProcessingToast(message: string) {
    const header = document.querySelector('dataviz-tool-header');
    if (header && typeof (header as any).showMessage === 'function') {
      (header as any).showMessage(message, 'info', 5000);
    }
  }

  private installHeaderProcessingToasts(header: any) {
    if (!header || header.__dvzNativeProjectProcessingToasts === '1' || header.__dvzProcessingToastsInstalled === '1') return;

    if (typeof header.showLoadModal === 'function') {
      const originalShowLoadModal = header.showLoadModal.bind(header);
      header.showLoadModal = (...args: any[]) => {
        this.showProcessingToast(t('processing.projectList'));
        return originalShowLoadModal(...args);
      };
    }

    if (typeof header.loadProject === 'function') {
      const originalLoadProject = header.loadProject.bind(header);
      header.loadProject = (...args: any[]) => {
        this.showProcessingToast(t('processing.projectLoad'));
        return originalLoadProject(...args);
      };
    }

    if (typeof header.saveProject === 'function') {
      const originalSaveProject = header.saveProject.bind(header);
      header.saveProject = (...args: any[]) => {
        this.showProcessingToast(t('processing.projectSave'));
        return originalSaveProject(...args);
      };
    }

    header.__dvzProcessingToastsInstalled = '1';
  }

  public async componentDidMount() {
    const params = new URLSearchParams(window.location.search);

    // ?data_url= support
    const dataUrl = params.get('data_url');
    if (dataUrl) {
      this.showProcessingToast(t('processing.sample'));
      this.props.dispatch(datasetLoad(
        (dataUrl.split('/').pop() || '').replace(/\.[^.]+$/, '') || 'data',
        { url: dataUrl } as any
      ));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const projectId = params.get('project_id');

    if (projectId) {
      console.log('Found project_id in URL. Checking authentication...');

      // @ts-ignore
      const supabase = window.datavizSupabase;
      if (!supabase) {
        console.error("Supabase client not found.");
        alert("認証クライアントの初期化に失敗しました。");
        return;
      }

      // Check current session
      const {data} = await supabase.auth.getSession();
      if (data.session) {
        await this.loadCloudProject(projectId);
      } else {
        // Wait for auth state change
        console.log('Waiting for authentication...');
        const {data: {subscription}} = supabase.auth.onAuthStateChange((event: string, session: any) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session) {
              this.loadCloudProject(projectId);
              subscription.unsubscribe();
            }
          }
        });
      }
    }
  }

  private async loadCloudProject(projectId: string) {
    if (this.isLoadingProject) return;
    this.isLoadingProject = true;

    console.log(`Loading project ${projectId}...`);

    try {
      const header = document.querySelector('dataviz-tool-header');
      if (!header) {
        throw new Error('dataviz-tool-header not found');
      }
      this.installHeaderProcessingToasts(header);
      const projectData = await (header as any).loadProject(projectId);
      const newState = fromSerializable(projectData);

      this.props.dispatch({
        type: SET_APPLICATION_STATE,
        payload: {
          state: newState
        }
      });

      // Remove query param from URL without reload
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path: newUrl}, '', newUrl);

      console.log('Project loaded successfully.');

    } catch (e) {
      console.error("Failed to load project from URL:", e);
      let msg = e.message;
      if (msg === 'Failed to fetch') {
        msg = "サーバーへの接続に失敗しました (Failed to fetch)。\nCORS設定やネットワーク接続を確認してください。";
      }
      alert(`プロジェクトの読み込みに失敗しました。\nエラー: ${msg}`);
    } finally {
      this.isLoadingProject = false;
    }
  }

  public render() {
    return <AppRoot />;
  }

  private update(nextProps: Props) {
    const {data, config, applicationState, dispatch, spec, filename} = nextProps;
    if (data) {
      this.setData(data, filename);
    }

    if (config) {
      this.setConfig(config);
    }

    if (spec) {
      // Note that this will overwrite other passed in props
      this.setSpec(spec, filename);
    }

    if (applicationState) {
      // Note that this will overwrite other passed in props
      this.setApplicationState(applicationState);
    }
  }

  private setData(data: Data, filename: string): any {
    return this.props.dispatch(datasetLoad(filename, data));
  }

  private setConfig(config: VoyagerConfig) {
    this.props.dispatch({
      type: SET_CONFIG,
      payload: {
        config,
      }
    });
  }

  private setSpec(spec: TopLevel<FacetedCompositeUnitSpec>, filename: string) {
    if (spec.data) {
      this.setData(spec.data, filename)
        .then(
          () => {
            this.shelfSpecLoad(spec);
          },
          (err: any) => {
            throw new Error('error setting data for spec:' + err.toString());
          }
        );
    } else {
      this.shelfSpecLoad(spec);
    }
  }

  private shelfSpecLoad(spec: TopLevel<FacetedCompositeUnitSpec>) {
    this.props.dispatch({
      type: SPEC_LOAD,
      payload: {
        spec,
        keepWildcardMark: false
      }
    });
  }

  private setApplicationState(state: Readonly<State>): void {
    this.props.dispatch({
      type: SET_APPLICATION_STATE,
      payload: {
        state,
      }
    });
  }
}
