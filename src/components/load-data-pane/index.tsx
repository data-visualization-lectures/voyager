import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import {connect} from 'react-redux';
import {VoyagerConfig} from '../../models/config';
import {State} from '../../models/index';
import {selectConfig} from '../../selectors/index';
import {DataSelector} from '../data-selector';
import * as styles from './load-data-pane.scss';


export interface DataPanelProps {
  config: VoyagerConfig;
}

export class LoadDataBase extends React.PureComponent<DataPanelProps, {}> {
  public render() {
    const {showDataSourceSelector} = this.props.config;
    if (showDataSourceSelector) {
      return (
        <div className="pane" styleName="load-data-pane">
          データセットを読み込んでください
          {' '}
          <DataSelector title="読み込む" />
        </div>
      );
    } else {
      // TODO: Make this a config parameter of lib-voyager
      return (
        <div className="pane" styleName="load-data-pane">
          データセットを読み込んでください。（Electronアプリの場合は、メニューバーを使用してください。）
        </div>
      );
    }
  }
}

export const LoadData = connect(
  (state: State) => {
    return {
      config: selectConfig(state)
    };
  }
)(CSSModules(LoadDataBase, styles));
