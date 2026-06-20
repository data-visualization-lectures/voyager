import {
  DEFAULT_STATE,
  fromSerializable,
  toSerializable
} from './index';

describe('models/index', () => {
  describe('serialization', () => {
    it('preserves thumbnailDataUri as persistent project metadata', () => {
      const thumbnailDataUri = 'data:image/png;base64,abc';
      const serializable = {
        ...toSerializable(DEFAULT_STATE),
        thumbnailDataUri,
      };

      const state = fromSerializable(serializable);

      expect(state.persistent.thumbnailDataUri).toEqual(thumbnailDataUri);
      expect((state.undoable.present as any).thumbnailDataUri).toBeUndefined();
      expect(toSerializable(state).thumbnailDataUri).toEqual(thumbnailDataUri);
    });
  });
});
