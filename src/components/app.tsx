import * as React from 'react';
import {Dispatch} from 'redux';
import {ActionCreators} from 'redux-undo';
import {Data} from 'vega-lite/build/src/data';
import {FacetedCompositeUnitSpec, TopLevel} from 'vega-lite/build/src/spec';
import {datasetLoad, SET_APPLICATION_STATE, SET_CONFIG} from '../actions';
import {SPEC_LOAD} from '../actions/shelf';
import {t} from '../i18n';
import {VoyagerConfig} from '../models/config';
import {State} from '../models/index';
import {
  applyProjectPayload,
  getToolHeader,
  installHeaderProcessingToasts,
  showProcessingToast
} from '../tool-header';
import {AppRoot} from './app-root';

export interface Props extends React.Props<App> {
  config?: VoyagerConfig;
  data?: Data;
  applicationState?: Readonly<State>;
  spec?: TopLevel<FacetedCompositeUnitSpec>;
  filename?: string;
  dispatch: Dispatch<State>;
}

function decodeSearchComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch (e) {
    return value;
  }
}

export function getSearchParamFromSearch(search: string, name: string): string | null {
  if (typeof URLSearchParams !== 'undefined') {
    return new URLSearchParams(search).get(name);
  }

  const query = search.charAt(0) === '?' ? search.slice(1) : search;
  if (!query) {
    return null;
  }

  for (const pair of query.split('&')) {
    const separatorIndex = pair.indexOf('=');
    const rawKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
    if (decodeSearchComponent(rawKey) === name) {
      const rawValue = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);
      return decodeSearchComponent(rawValue);
    }
  }

  return null;
}

export function getProjectIdFromSearch(search: string): string | null {
  return getSearchParamFromSearch(search, 'projectId');
}

export class App extends React.PureComponent<Props, {}> {
  private isLoadingProject = false;

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

  public async componentDidMount() {
    // ?data_url= support
    const dataUrl = getSearchParamFromSearch(window.location.search, 'data_url');
    if (dataUrl) {
      showProcessingToast(t('processing.sample'));
      this.props.dispatch(datasetLoad(
        (dataUrl.split('/').pop() || '').replace(/\.[^.]+$/, '') || 'data',
        { url: dataUrl } as any
      ));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const projectId = getProjectIdFromSearch(window.location.search);

    if (projectId) {
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

  public render() {
    return <AppRoot />;
  }

  private async loadCloudProject(projectId: string) {
    if (this.isLoadingProject) {
      return;
    }
    this.isLoadingProject = true;

    try {
      const header = getToolHeader();
      if (!header || typeof header.loadProject !== 'function') {
        throw new Error('dataviz-tool-header not found');
      }
      installHeaderProcessingToasts(header);
      const projectData = await header.loadProject(projectId);
      applyProjectPayload(this.props.dispatch, projectData, {projectId});

      // Remove query param from URL without reload
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path: newUrl}, '', newUrl);
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
