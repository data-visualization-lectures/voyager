import * as React from 'react';
import {connect} from 'react-redux';
import {REDO, UNDO} from '../../actions/undo-redo';
import {State} from '../../models';

export interface UndoRedoProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

class UndoRedoBase extends React.PureComponent<UndoRedoProps, any> {
  public render() {
    const {canUndo, canRedo, onUndo, onRedo} = this.props;
    return (
      <div>
        <button onClick={onUndo} disabled={!canUndo}>
          <i className='fa fa-undo' /> 元に戻す
        </button>
        <button onClick={onRedo} disabled={!canRedo}>
          <i className='fa fa-repeat' /> やり直す
        </button>
      </div>
    );
  }
}

export const UndoRedo = connect((state: State) => {
  return {
    canUndo: state.undoable.past.length > 0,
    canRedo: state.undoable.future.length > 0
  };
}, dispatch => ({
  onUndo() {
    dispatch({type: UNDO});
  },
  onRedo() {
    dispatch({type: REDO});
  }
}))(UndoRedoBase);

