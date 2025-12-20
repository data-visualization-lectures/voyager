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
import {ProjectLoadModal} from './project-load-modal';

export interface HeaderState {
  loadModalIsOpen: boolean;
  notification?: {
    message: string;
    type: 'success' | 'error';
  } | null;
}

export interface HeaderProps {
  data: InlineData;
  state: State;
  dispatch: Dispatch<State>;
}

export class HeaderBase extends React.PureComponent<HeaderProps, HeaderState> {
  private fileInput: HTMLInputElement;
  private notificationTimer: any;

  constructor(props: HeaderProps) {
    super(props);
    this.state = {
      loadModalIsOpen: false,
      notification: null
    };
    this.handleSaveProject = this.handleSaveProject.bind(this);
    this.handleLoadProject = this.handleLoadProject.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
    this.closeLoadModal = this.closeLoadModal.bind(this);
    this.onProjectLoaded = this.onProjectLoaded.bind(this);
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    if (this.notificationTimer) clearTimeout(this.notificationTimer);

    this.setState({
      notification: {message, type}
    });

    // Auto fade out after 3 seconds
    this.notificationTimer = setTimeout(() => {
      this.setState({notification: null});
    }, 3000);
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

        {/* Toast Notification */}
        {this.state.notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: this.state.notification.type === 'error' ? '#d9534f' : '#5cb85c',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'opacity 0.3s ease-in-out'
          }}>
            {this.state.notification.message}
          </div>
        )}

        <ProjectLoadModal
          isOpen={this.state.loadModalIsOpen}
          onRequestClose={this.closeLoadModal}
          onLoadProject={this.onProjectLoaded}
        />
      </div >
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

      // Capture thumbnail
      let thumbnailBlob: Blob | null = null;
      try {
        // Find all canvases inside .chart elements
        const canvases = document.querySelectorAll('.chart canvas');

        let targetCanvas: HTMLCanvasElement | null = null;

        if (canvases.length > 0) {
          // If multiple canvases, pick the largest one (assuming it's the main chart)
          let maxSize = 0;
          for (let i = 0; i < canvases.length; i++) {
            const c = canvases[i] as HTMLCanvasElement;
            const size = c.width * c.height; // Use pixel area
            if (size > maxSize && c.width > 0 && c.height > 0) {
              maxSize = size;
              targetCanvas = c;
            }
          }
        }

        if (targetCanvas) {
          console.log(`Canvas found (size: ${targetCanvas.width}x${targetCanvas.height}), capturing thumbnail...`);
          // Wrap toBlob in Promise
          thumbnailBlob = await new Promise<Blob | null>(resolve => {
            targetCanvas!.toBlob(blob => resolve(blob), 'image/png');
          });
        } else {
          console.warn("No suitable chart canvas found for thumbnail.");
          alert("サムネイル生成エラー: チャートのCanvasが見つかりませんでした。");
        }

        if (thumbnailBlob) {
          console.log(`Thumbnail captured. Size: ${thumbnailBlob.size} bytes`);
        } else {
          console.warn("Thumbnail capture failed or resulted in null.");
          // Only alert if we found a canvas but failed to capture. If no canvas, we already alerted.
          if (targetCanvas) {
            alert("サムネイル生成エラー: Canvasからの画像生成に失敗しました (Blob is null)。");
          }
        }
      } catch (err) {
        console.error("Failed to capture thumbnail exception:", err);
      }

      // Use CloudApi to save
      // Dynamic import to avoid build errors if CloudApi is not yet bundled in a way webpack likes (though it should be fine)
      const {CloudApi} = await import('../../api/cloud-api');

      if (session && session.user) {
        await CloudApi.saveProject('voyager2', name, serializableState, thumbnailBlob, session.user.id);
      } else {
        // Should have returned earlier if no session, but for safety:
        await CloudApi.saveProject('voyager2', name, serializableState, thumbnailBlob);
      }

      this.showNotification("クラウドにプロジェクトを保存しました！");

    } catch (e) {
      console.error("Failed to save project to cloud:", e);
      this.showNotification("クラウド保存に失敗しました：" + e.message, 'error');
    }
  }

  private closeLoadModal() {
    this.setState({loadModalIsOpen: false});
  }

  private onProjectLoaded(projectContent: any) {
    try {
      const newState = fromSerializable(projectContent);
      this.props.dispatch({
        type: SET_APPLICATION_STATE,
        payload: {
          state: newState
        }
      });
      this.showNotification("プロジェクトを読み込みました。");
    } catch (e) {
      console.error("Failed to parse project:", e);
      this.showNotification("プロジェクトデータの読み込みに失敗しました。", 'error');
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

    this.setState({loadModalIsOpen: true});
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
