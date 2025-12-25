import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import Modal from 'react-modal';
import {CloudApi, CloudProject} from '../../api/cloud-api'; // Ensure this path is correct
import * as styles from './project-load-modal.scss';

export interface ProjectLoadModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onLoadProject: (projectContent: any) => void;
}

export interface ProjectLoadModalState {
  projects: CloudProject[];
  thumbnails: {[key: string]: string};
  loading: boolean;
  error: string | null;
}

class ProjectLoadModalBase extends React.PureComponent<ProjectLoadModalProps, ProjectLoadModalState> {
  constructor(props: ProjectLoadModalProps) {
    super(props);
    this.state = {
      projects: [],
      thumbnails: {},
      loading: false,
      error: null
    };

    this.handleDelete = this.handleDelete.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  public componentWillReceiveProps(nextProps: ProjectLoadModalProps) {
    if (nextProps.isOpen && !this.props.isOpen) {
      this.fetchProjects();
    }
  }

  private async fetchProjects() {
    this.setState({loading: true, error: null});
    try {
      const projects = await CloudApi.getProjects('voyager2');
      // Sort by updated_at desc
      projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      this.setState({projects});

      // Fetch thumbnails asynchronously
      this.fetchThumbnails(projects);
    } catch (e) {
      this.setState({error: e.message});
    } finally {
      this.setState({loading: false});
    }
  }

  private async fetchThumbnails(projects: CloudProject[]) {
    const thumbnails: {[key: string]: string} = {};

    // We can fetch in parallel or sequence. Parallel is better.
    // However, if we have many, we might want to batch. For now, simple Promise.all
    await Promise.all(projects.map(async (p) => {
      if (p.thumbnail_path) {
        const url = await CloudApi.getThumbnailUrl(p.id);
        if (url) {
          thumbnails[p.id] = url;
        }
      }
    }));

    this.setState({thumbnails});
  }

  private async handleDelete(e: React.SyntheticEvent<any>, project: CloudProject) {
    e.stopPropagation();
    if (!confirm(`プロジェクト「${project.name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await CloudApi.deleteProject(project.id);
      // Remove from state
      this.setState({
        projects: this.state.projects.filter(p => p.id !== project.id)
      });
    } catch (e) {
      alert("削除に失敗しました: " + e.message);
    }
  }

  private async handleLoad(project: CloudProject) {
    this.setState({loading: true});
    try {
      const content = await CloudApi.getProjectContent(project.id);
      this.props.onLoadProject(content);
      this.props.onRequestClose();
    } catch (e) {
      alert("読み込みに失敗しました: " + e.message);
      this.setState({loading: false});
    }
  }

  public render() {
    const {isOpen, onRequestClose} = this.props;
    const {projects, loading, error, thumbnails} = this.state;

    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Load Project"
        className="voyager" // Using same class pattern as bookmark/index.tsx
        overlayClassName="ReactModal__Overlay" // Default or custom? Bookmark uses implicit defaults via CSS/globals usually.
        // Assuming global styles handle .voyager.ReactModal__Content etc, but we'll see.
        style={{
          content: {
            top: '10%',
            left: '10%',
            right: '10%',
            bottom: '10%',
            padding: '20px',
            overflow: 'hidden'
          }
        }}
      >
        <div styleName="modal-content">
          <div styleName="modal-header">
            <h3>クラウドプロジェクトを開く</h3>
            <span styleName="close-button" onClick={onRequestClose}>&times;</span>
          </div>

          {loading && projects.length === 0 && (
            <div styleName="loading-state">読み込み中...</div>
          )}

          {error && (
            <div styleName="empty-state" style={{color: 'red'}}>Error: {error}</div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div styleName="empty-state">保存されたプロジェクトはありません。</div>
          )}

          <div styleName="project-grid">
            {projects.map(p => (
              <div
                key={p.id}
                styleName="project-card"
                onClick={() => this.handleLoad(p)}
              >
                <div styleName="thumbnail-container">
                  {thumbnails[p.id] ? (
                    <img src={thumbnails[p.id]} alt={p.name} />
                  ) : (
                    <div styleName="placeholder">
                      <i className="fa fa-area-chart" />
                    </div>
                  )}
                </div>
                <div styleName="details">
                  <div styleName="title" title={p.name}>{p.name}</div>
                  <div styleName="date">{new Date(p.updated_at).toLocaleString()}</div>
                  <div styleName="actions">
                    <button
                      styleName="btn-load"
                      onClick={(e) => {e.stopPropagation(); this.handleLoad(p);}}
                    >
                      開く
                    </button>
                    <button
                      styleName="btn-delete"
                      onClick={(e) => this.handleDelete(e, p)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
  }
}

export const ProjectLoadModal = CSSModules(ProjectLoadModalBase, styles);
