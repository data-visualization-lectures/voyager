import {translateVegaLiteLogToJa} from './vega-lite-log';

const TIME_SCALE_BAR =
  'A time scale is used with bar mark. This can be misleading as the width of the bar ' +
  'can be arbitrary based on the scale domain. You may want to use point mark instead.';

const TIME_SCALE_AREA =
  'A time scale is used with area mark. This can be misleading as the width of the area ' +
  'can be arbitrary based on the scale domain. You may want to use point mark instead.';

describe('i18n/vega-lite-log', () => {
  it('translates a time scale used with bar mark', () => {
    expect(translateVegaLiteLogToJa(TIME_SCALE_BAR)).toEqual(
      '時間スケールが bar マークとともに使われています。スケールのドメインによって bar の幅が任意になるため、' +
      '誤解を招くことがあります。代わりに point マークの使用を検討してください。'
    );
  });

  it('translates a time scale used with area mark', () => {
    expect(translateVegaLiteLogToJa(TIME_SCALE_AREA)).toEqual(
      '時間スケールが area マークとともに使われています。スケールのドメインによって area の幅が任意になるため、' +
      '誤解を招くことがあります。代わりに point マークの使用を検討してください。'
    );
  });

  it('translates an incompatible encoding channel', () => {
    expect(translateVegaLiteLogToJa(
      'shape dropped as it is incompatible with "tick".'
    )).toEqual(
      'shape は "tick" と互換性がないため除外されました。'
    );
  });

  it('leaves unknown messages unchanged', () => {
    expect(translateVegaLiteLogToJa('Some other compiler warning.')).toEqual(
      'Some other compiler warning.'
    );
  });
});
