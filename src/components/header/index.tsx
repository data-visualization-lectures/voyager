import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {InlineData} from 'vega-lite/build/src/data';

import * as logo from '../../../images/logo.png';
import {fromSerializable, State, toSerializable} from '../../models/index';
import {SET_APPLICATION_STATE} from '../../actions/state';
import {selectData} from '../../selectors/dataset';
import {Controls} from './controls';
import * as styles from './header.scss';

export interface HeaderProps {
  data: InlineData;
  state: State;
  dispatch: Dispatch<State>;
}

export class HeaderBase extends React.PureComponent<HeaderProps, {}> {
  private fileInput: HTMLInputElement;

  constructor(props: HeaderProps) {
    super(props);
    this.handleSaveProject = this.handleSaveProject.bind(this);
    this.handleLoadProject = this.handleLoadProject.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
  }

  public render() {
    const {data} = this.props;

    return (
      <div styleName='header'>
        <img styleName='voyager-logo' src={logo} />
        {data && <Controls />}
        <div styleName='right-controls'>
          <input
            type="file"
            accept=".json"
            style={{display: 'none'}}
            ref={ref => this.fileInput = ref}
            onChange={this.onFileChange}
          />
          <button className="command" onClick={this.handleLoadProject}>
            <i className="fa fa-folder-open" /> プロジェクト・ファイルの読込
          </button>
          <button className="command" onClick={this.handleSaveProject}>
            <i className="fa fa-floppy-o" /> プロジェクト・ファイルの保存
          </button>
        </div>
      </div>
    );
  }

  private async handleSaveProject() {
    const {state} = this.props;

    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) {
      alert("Supabase client is not initialized.");
      return;
    }
    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
      if (confirm("ログインしていません。ローカルファイルとして保存しますか？\n（クラウド保存するには https://auth.dataviz.jp でログインしてください）")) {
        this.saveLocalProject(state);
      }
      return;
    }

    const name = prompt("保存するプロジェクト名を入力してください", `Voyager Project ${new Date().toLocaleString()}`);
    if (!name) return; // Cancelled

    try {
      const serializableState = toSerializable(state);

      // Use CloudApi to save
      // Dynamic import to avoid build errors if CloudApi is not yet bundled in a way webpack likes (though it should be fine)
      const {CloudApi} = await import('../../api/cloud-api');

      await CloudApi.saveProject('voyager2', name, serializableState);

      alert("クラウドにプロジェクトを保存しました！");

    } catch (e) {
      console.error("Failed to save project to cloud:", e);
      alert("クラウド保存に失敗しました：" + e.message);
    }
  }

  private saveLocalProject(state: State) {
    try {
      const serializableState = toSerializable(state);
      const jsonString = JSON.stringify(serializableState, null, 2);
      const blob = new Blob([jsonString], {type: "application/json"});
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = "voyager-project.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to save local project:", e);
      alert("プロジェクトの保存に失敗しました。");
    }
  }

  private async handleLoadProject() {
    // @ts-ignore
    const supabase = window.supabase;
    if (!supabase) {
      this.loadLocalProject();
      return;
    }
    const {data: {session}} = await supabase.auth.getSession();

    if (!session) {
      if (confirm("ログインしていません。ローカルファイルから読み込みますか？")) {
        this.loadLocalProject();
      }
      return;
    }

    if (!confirm("クラウドからプロジェクトを読み込みますか？\n（キャンセルを押すとローカルファイルを選択できます）")) {
      this.loadLocalProject();
      return;
    }

    try {
      const {CloudApi} = await import('../../api/cloud-api');
      const projects = await CloudApi.getProjects('voyager2');

      if (projects.length === 0) {
        alert("保存されたプロジェクトはありません。");
        return;
      }

      // Create a simple selection list for prompt
      // Note: Sort by updated_at desc usually handled by API, but let's trust API.
      const listStr = projects.map((p, i) => `[${i + 1}] ${p.name} (${new Date(p.updated_at).toLocaleString()})`).join('\n');

      const selection = prompt(`読み込むプロジェクトの番号を入力してください：\n\n${listStr}`);
      if (!selection) return;

      const index = parseInt(selection, 10) - 1;
      if (isNaN(index) || index < 0 || index >= projects.length) {
        alert("無効な番号です。");
        return;
      }

      const project = projects[index];
      const projectData = await CloudApi.getProjectContent(project.id);

      // Deserialize and load
      const newState = fromSerializable(projectData);

      this.props.dispatch({
        type: SET_APPLICATION_STATE,
        payload: {
          state: newState
        }
      });

      alert(`プロジェクト「${project.name}」を読み込みました。`);

    } catch (e) {
      console.error("Failed to load cloud project:", e);
      alert("クラウドからの読み込みに失敗しました：" + e.message);
    }
  }

  private loadLocalProject() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  private onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target.result as string;
        const serializableState = JSON.parse(jsonString);
        const newState = fromSerializable(serializableState);

        this.props.dispatch({
          type: SET_APPLICATION_STATE,
          payload: {
            state: newState
          }
        });
      } catch (error) {
        console.error("Failed to load project:", error);
        alert("プロジェクトファイルの読み込みに失敗しました。ファイル形式を確認してください。");
      }
    };
    reader.readAsText(file);

    // Clear the input so the same file can be selected again if needed
    e.target.value = '';
  }
}

export const Header = connect(
  (state: State) => {
    // Pass the entire state to the component for serialization
    return {
      data: selectData(state),
      state: state
    };
  },
  (dispatch: Dispatch<State>) => ({dispatch})
)(CSSModules(HeaderBase, styles));
