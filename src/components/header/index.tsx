import * as React from 'react';
import * as CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { InlineData } from 'vega-lite/build/src/data';

import * as logo from '../../../images/logo.png';
import { State } from '../../models/index';
import { selectData } from '../../selectors/dataset';
import { Controls } from './controls';
import * as styles from './header.scss';

export interface HeaderProps {
  data: InlineData;
  dispatch: Dispatch<State>;
}

export class HeaderBase extends React.PureComponent<HeaderProps> {
  public render() {
    const { data } = this.props;

    return (
      <div styleName='header'>
        <img styleName='voyager-logo' src={logo} />
        {data && <Controls />}
      </div>
    );
  }
}

export const Header = connect(
  (state: State) => ({
    data: selectData(state),
  }),
  (dispatch: Dispatch<State>) => ({ dispatch })
)(CSSModules(HeaderBase, styles));
