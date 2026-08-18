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

  it('translates shape channel compatibility', () => {
    expect(translateVegaLiteLogToJa(
      'Shape channel should be used with nominal data or geojson only'
    )).toEqual(
      'shape チャネルは nominal データまたは geojson のみで使ってください。'
    );
  });

  it('translates other fieldDef channel compatibility warnings', () => {
    expect(translateVegaLiteLogToJa(
      'Channel size should not be used with discrete field.'
    )).toEqual(
      'チャネル size は離散フィールドでは使えません。'
    );
    expect(translateVegaLiteLogToJa(
      'Channel latitude should not be used with nominal field.'
    )).toEqual(
      'チャネル latitude は nominal フィールドでは使えません。'
    );
    expect(translateVegaLiteLogToJa(
      'Channel order is inappropriate for nominal field, which has no inherent order.'
    )).toEqual(
      'order チャネルは順序を持たない nominal フィールドには適していません。'
    );
  });

  it('translates dropping color when fill is also present', () => {
    expect(translateVegaLiteLogToJa(
      'Dropping color encoding as the plot also has fill'
    )).toEqual(
      'プロットに fill もあるため、color のエンコーディングを除外しました'
    );
  });

  it('translates remaining Vega-Lite 2.4 compiler warnings instead of leaving them in English', () => {
    const samples = [
      'Cannot use a fixed value of "rangeStep" when "autosize" is "fit".',
      'Scale bindings are currently only supported for scales with unbinned, continuous domains.',
      'Axes cannot be shared in concatenated views.',
      'Axes cannot be shared in repeated views.',
      'Cannot set title "anchor" for a layer spec',
      'Unrecognized parse "foo".',
      'An ancestor parsed field "year" as number but a child wants to parse the field as string.',
      'Ignoring an invalid transform: {"foo":1}.',
      'If "from.fields" is not specified, "as" has to be a string that specifies the key ' +
        'to be used for the data from the secondary source.',
      'Layer\'s shared color channel is overriden',
      'Layer\'s shared projection {"type":"albersUsa"} is overridden by a child projection {"type":"mercator"}.',
      'Channel color is a string. Converted to {value: "red"}.',
      'Dropping {"field":"foo"} from channel "color" since it does not contain data field or value.',
      'latitude-encoding with type nominal is deprecated. Replacing with latitude-encoding.',
      'Bar mark should not be used with point scale when rangeStep is null. Please use band scale instead.',
      'Line mark is for continuous lines and thus cannot be used with x2. ' +
        'We will use the rule mark (line segments) instead.',
      'custom domain scale cannot be unioned with default field-based domain',
      'Cannot use the scale property "scheme" with non-color channel.',
      'Using unaggregated domain with raw field has no effect ({"field":"a"}).',
      'Unaggregated domain not applicable for "mean" since it produces values outside ' +
        'the origin domain of the source data.',
      'Unaggregated domain is currently unsupported for log scale ({"field":"a"}).',
      'Using size field when x-channel has a band scale is not supported.',
      'Cannot apply size to non-oriented mark "point".',
      'rangeStep for "x" is dropped as top-level width is provided.',
      'FieldDef does not work with "log" scale. We are using "linear" scale instead.',
      'x-scale\'s "nice" is dropped as it does not work with log scale.',
      'Conflicting scale property "type" ("log" and "linear").  Using "log".',
      'Setting the scale to be independent for "color" means we also have to set the guide ' +
        '(axis or legend) to be independent.',
      'Cannot set x-scale\'s "domain" as it is binned. Please use "bin"\'s "extent" instead.',
      'Dropping sort property {"op":"mean"} as unioned domains only support boolean or op \'count\'.',
      'Unable to merge domains',
      'Domains that should be unioned has conflicting sort properties. Sort will be set to true.',
      'Invalid channel for axis.',
      'Stacking is applied even though the aggregate function is non-summative ("mean")',
      'Time unit "year-day" is not supported. We are replacing it with year-date.',
      'Dropping day from datetime {"day":1,"month":1} as day cannot be combined with other units.',
      'Invalid quarter: 5',
      'Unknown field for ${channel}.  Cannot calculate view size.',
      'The same selection must be used to override scale domains in a layered view.',
      'Interval selections only support x and y encoding channels.',
      'mousedown is not an ordered event stream for interval selections',
      'Use "bind": "scales" to setup a binding for scales and selections within the same view.',
      'A "field" or "encoding" must be specified when using a selection as a scale domain. Using "field": "Origin".',
      'Continuous axis should not have customized aggregation function mean',
      'Only use this method with binned field defs'
    ];
    samples.forEach(message => {
      const translated = translateVegaLiteLogToJa(message);
      expect(translated).not.toEqual(message);
      expect(translated.length).toBeGreaterThan(0);
    });
  });

  it('leaves unknown messages unchanged', () => {
    expect(translateVegaLiteLogToJa('Some other compiler warning.')).toEqual(
      'Some other compiler warning.'
    );
  });
});
