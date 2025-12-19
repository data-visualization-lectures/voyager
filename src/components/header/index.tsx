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

  private handleSaveProject() {
    const {state} = this.props;
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
      console.error("Failed to save project:", e);
      alert("プロジェクトの保存に失敗しました。");
    }
  }

  private handleLoadProject() {
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
