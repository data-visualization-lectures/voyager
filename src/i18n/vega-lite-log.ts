import {getLocale} from './index';

function toLogText(message: any): string {
  if (typeof message === 'string') {
    return message;
  }
  if (message && typeof message.message === 'string') {
    return message.message;
  }
  return String(message);
}

function jaScaleText(scaleText: string): string {
  if (scaleText === 'scale with zero=false') {
    return 'zero=false のスケール';
  }
  if (scaleText === 'scale with custom domain that excludes zero') {
    return 'ゼロを含まないカスタムドメインのスケール';
  }
  const scaleTypeMatch = /^(.+) scale$/.exec(scaleText);
  if (scaleTypeMatch) {
    return jaScaleType(scaleTypeMatch[1]) + 'スケール';
  }
  return scaleText;
}

function jaScaleType(scaleType: string): string {
  if (scaleType === 'time') {
    return '時間';
  }
  if (scaleType === 'utc') {
    return 'UTC';
  }
  if (scaleType === 'log') {
    return '対数';
  }
  if (scaleType === 'linear') {
    return '線形';
  }
  return scaleType;
}

function jaDimension(dimension: string): string {
  if (dimension === 'width') {
    return '幅';
  }
  if (dimension === 'height') {
    return '高さ';
  }
  return dimension;
}

interface TranslationRule {
  pattern: RegExp;
  toJa: (match: RegExpExecArray) => string;
}

const RULES: TranslationRule[] = [
  {
    pattern: new RegExp([
      '^A (.+) is used with (bar|area) mark\\. ',
      'This can be misleading as the (width|height) of the \\2 ',
      'can be arbitrary based on the scale domain\\. ',
      'You may want to use point mark instead\\.$'
    ].join('')),
    toJa: match => {
      return jaScaleText(match[1]) + 'が ' + match[2] +
        ' マークとともに使われています。スケールのドメインによって ' + match[2] +
        ' の' + jaDimension(match[3]) +
        'が任意になるため、誤解を招くことがあります。代わりに point マークの使用を検討してください。';
    }
  },
  {
    pattern: /^(\S+) dropped as it is incompatible with "([^"]+)"(?: when (.+))?\.$/,
    toJa: match => {
      const when = match[3] ? '（' + match[3] + ' の場合）' : '';
      return match[1] + ' は "' + match[2] + '" と互換性がないため除外されました' + when + '。';
    }
  },
  {
    pattern: /^Invalid spec$/,
    toJa: () => '不正な仕様です'
  },
  {
    pattern: /^Autosize "fit" only works for single views and layered views\.$/,
    toJa: () => 'autosize の "fit" は単一ビューとレイヤービューでのみ使えます。'
  },
  {
    pattern: /^Cannot project a selection on encoding channel "([^"]+)", which has no field\.$/,
    toJa: match => 'フィールドのないエンコーディングチャネル "' + match[1] + '" には選択を投影できません。'
  },
  {
    pattern: /^The "nearest" transform is not supported for (.+) marks\.$/,
    toJa: match => '"nearest" 変換は ' + match[1] + ' マークでは使えません。'
  },
  {
    pattern: /^Cannot find a selection named "([^"]+)"$/,
    toJa: match => '"' + match[1] + '" という名前の選択が見つかりません'
  },
  {
    pattern: /^Unknown repeated value "([^"]+)"\.$/,
    toJa: match => '未知の repeat 値 "' + match[1] + '" です。'
  },
  {
    pattern: /^Invalid field type "([^"]+)"$/,
    toJa: match => '不正なフィールドタイプ "' + match[1] + '" です'
  },
  {
    pattern: /^Invalid field type "([^"]+)" for aggregate: "([^"]+)", using "quantitative" instead\.$/,
    toJa: match => '集計 "' + match[2] + '" に対するフィールドタイプ "' + match[1] +
      '" は不正なため、代わりに "quantitative" を使います。'
  },
  {
    pattern: /^Invalid aggregation operator "([^"]+)"$/,
    toJa: match => '不正な集計演算子 "' + match[1] + '" です'
  },
  {
    pattern: /^Invalid field type "([^"]+)" for channel "([^"]+)", using "([^"]+)" instead\.$/,
    toJa: match => 'チャネル "' + match[2] + '" に対するフィールドタイプ "' + match[1] +
      '" は不正なため、代わりに "' + match[3] + '" を使います。'
  },
  {
    pattern: /^(\S+) encoding should be discrete \(ordinal \/ nominal \/ binned\)\.$/,
    toJa: match => match[1] + ' エンコーディングは離散（ordinal / nominal / binned）である必要があります。'
  },
  {
    pattern: /^(\S+)-encoding is dropped as \1 is not a valid encoding channel\.$/,
    toJa: match => match[1] + ' は有効なエンコーディングチャネルではないため除外されました。'
  },
  {
    pattern: new RegExp(
      '^Using discrete channel "([^"]+)" to encode "([^"]+)" field ' +
      'can be misleading as it does not encode (order|magnitude)\\.$'
    ),
    toJa: match => {
      const encoded = match[3] === 'order' ? '順序' : '大きさ';
      return '離散チャネル "' + match[1] + '" で "' + match[2] +
        '" フィールドをエンコードすると、' + encoded + 'が表現されないため誤解を招くことがあります。';
    }
  },
  {
    pattern: /^Line marks cannot encode size with a non-groupby field\. You may want to use trail marks instead\.$/,
    toJa: () => 'line マークは groupby でないフィールドで size をエンコードできません。代わりに trail マークの使用を検討してください。'
  },
  {
    pattern: new RegExp(
      '^Cannot clearly determine orientation for "([^"]+)" since both x and y ' +
      'channel encode continuous fields\\. In this case, we use vertical by default$'
    ),
    toJa: match => 'x と y の両方が連続フィールドのため "' + match[1] +
      '" の向きを明確に判断できません。この場合、既定で vertical を使います'
  },
  {
    pattern: new RegExp(
      '^Cannot clearly determine orientation for "([^"]+)" since both x and y ' +
      'channel encode discrete or empty fields\\.$'
    ),
    toJa: match => 'x と y の両方が離散または空のフィールドのため "' +
      match[1] + '" の向きを明確に判断できません。'
  },
  {
    pattern: /^Specified orient "([^"]+)" overridden with "([^"]+)"$/,
    toJa: match => '指定された向き "' + match[1] + '" は "' + match[2] + '" で上書きされました'
  },
  {
    pattern: /^Channel "([^"]+)" does not work with "([^"]+)" scale\. We are using "([^"]+)" scale instead\.$/,
    toJa: match => 'チャネル "' + match[1] + '" は "' + match[2] + '" スケールと組み合わせられません。代わりに "' +
      match[3] + '" スケールを使います。'
  },
  {
    pattern: /^Scale type "([^"]+)" does not work with mark "([^"]+)"\.$/,
    toJa: match => 'スケールタイプ "' + match[1] + '" はマーク "' + match[2] + '" と組み合わせられません。'
  },
  {
    pattern: /^Cannot stack "([^"]+)" if there is already "([^"]+)"$/,
    toJa: match => '"' + match[2] + '" が既にあるため "' + match[1] + '" をスタックできません'
  },
  {
    pattern: /^Cannot stack non-linear scale \((.+)\)$/,
    toJa: match => '非線形スケール（' + match[1] + '）はスタックできません'
  },
  {
    pattern: /^Shape channel should be used with nominal data or geojson only$/,
    toJa: () => 'shape チャネルは nominal データまたは geojson のみで使ってください。'
  },
  {
    pattern: /^Channel (\S+) should not be used with discrete field\.$/,
    toJa: match => 'チャネル ' + match[1] + ' は離散フィールドでは使えません。'
  },
  {
    pattern: /^Channel (\S+) should not be used with (\S+) field\.$/,
    toJa: match => 'チャネル ' + match[1] + ' は ' + match[2] + ' フィールドでは使えません。'
  },
  {
    pattern: /^Channel order is inappropriate for nominal field, which has no inherent order\.$/,
    toJa: () => 'order チャネルは順序を持たない nominal フィールドには適していません。'
  },
  {
    pattern: /^Cannot use a fixed value of "rangeStep" when "autosize" is "fit"\.$/,
    toJa: () => 'autosize が "fit" のときは "rangeStep" に固定値を使えません。'
  },
  {
    pattern: /^Scale bindings are currently only supported for scales with unbinned, continuous domains\.$/,
    toJa: () => 'スケールのバインディングは、現在ビン化されていない連続ドメインのスケールでのみ使えます。'
  },
  {
    pattern: /^Axes cannot be shared in concatenated views\.$/,
    toJa: () => '連結ビューでは軸を共有できません。'
  },
  {
    pattern: /^Axes cannot be shared in repeated views\.$/,
    toJa: () => 'repeat ビューでは軸を共有できません。'
  },
  {
    pattern: /^Cannot set title "anchor" for a (.+) spec$/,
    toJa: match => match[1] + ' 仕様では title の "anchor" を設定できません'
  },
  {
    pattern: /^Unrecognized parse "([^"]+)"\.$/,
    toJa: match => '未知の parse "' + match[1] + '" です。'
  },
  {
    pattern: /^An ancestor parsed field "([^"]+)" as (.+) but a child wants to parse the field as (.+)\.$/,
    toJa: match => '祖先がフィールド "' + match[1] + '" を ' + match[2] +
      ' として解析しましたが、子は ' + match[3] + ' として解析しようとしています。'
  },
  {
    pattern: /^Ignoring an invalid transform: (.+)\.$/,
    toJa: match => '不正な変換を無視します: ' + match[1] + '。'
  },
  {
    pattern: new RegExp(
      '^If "from\\.fields" is not specified, "as" has to be a string that specifies ' +
      'the key to be used for the data from the secondary source\\.$'
    ),
    toJa: () => '"from.fields" が指定されていない場合、"as" は二次ソースのデータのキーを示す文字列である必要があります。'
  },
  {
    pattern: /^Layer's shared (.+) channel (is|are) overriden$/,
    toJa: match => 'レイヤーで共有されている ' + match[1] + ' チャネルは上書きされました'
  },
  {
    pattern: /^Layer's shared projection (.+) is overridden by a child projection (.+)\.$/,
    toJa: match => 'レイヤーで共有されている投影 ' + match[1] + ' は、子の投影 ' + match[2] + ' で上書きされました。'
  },
  {
    pattern: /^Channel (\S+) is a (string|number|boolean)\. Converted to \{value: (.+)\}\.$/,
    toJa: match => 'チャネル ' + match[1] + ' は ' + match[2] +
      ' です。{value: ' + match[3] + '} に変換しました。'
  },
  {
    pattern: /^Dropping color (encoding|property) as the plot also has (fill and stroke|fill|stroke)$/,
    toJa: match => {
      const kind = match[1] === 'encoding' ? 'エンコーディング' : 'プロパティ';
      const extras = match[2] === 'fill and stroke' ? 'fill と stroke' : match[2];
      return 'プロットに ' + extras + ' もあるため、color の' + kind + 'を除外しました';
    }
  },
  {
    pattern: /^Dropping (.+) from channel "([^"]+)" since it does not contain data field or value\.$/,
    toJa: match => 'データフィールドも値も含まないため、チャネル "' + match[2] + '" から ' +
      match[1] + ' を除外しました。'
  },
  {
    pattern: /^(\S+)-encoding with type (\S+) is deprecated\. Replacing with (\S+)-encoding\.$/,
    toJa: match => 'タイプ ' + match[2] + ' の ' + match[1] +
      ' エンコーディングは非推奨です。' + match[3] + ' エンコーディングに置き換えます。'
  },
  {
    pattern: /^Bar mark should not be used with point scale when rangeStep is null\. Please use band scale instead\.$/,
    toJa: () => 'rangeStep が null のとき、bar マークは point スケールと組み合わせないでください。' +
      '代わりに band スケールを使ってください。'
  },
  {
    pattern: new RegExp(
      '^Line mark is for continuous lines and thus cannot be used with (x2 and y2|x2|y2)\\. ' +
      'We will use the rule mark \\(line segments\\) instead\\.$'
    ),
    toJa: match => 'line マークは連続線用のため ' + match[1] +
      ' とは組み合わせられません。代わりに rule マーク（線分）を使います。'
  },
  {
    pattern: /^custom domain scale cannot be unioned with default field-based domain$/,
    toJa: () => 'カスタムドメインのスケールは、既定のフィールドベースドメインと統合できません'
  },
  {
    pattern: /^Cannot use the scale property "([^"]+)" with non-color channel\.$/,
    toJa: match => 'スケールプロパティ "' + match[1] + '" は color 以外のチャネルでは使えません。'
  },
  {
    pattern: /^Using unaggregated domain with raw field has no effect \((.+)\)\.$/,
    toJa: match => '未集計ドメインを生フィールドと使う効果はありません（' + match[1] + '）。'
  },
  {
    pattern: new RegExp(
      '^Unaggregated domain not applicable for "([^"]+)" since it produces values ' +
      'outside the origin domain of the source data\\.$'
    ),
    toJa: match => '"' + match[1] + '" は元データのドメイン外の値を出すため、未集計ドメインは適用できません。'
  },
  {
    pattern: /^Unaggregated domain is currently unsupported for log scale \((.+)\)\.$/,
    toJa: match => '未集計ドメインは現在、対数スケールでは使えません（' + match[1] + '）。'
  },
  {
    pattern: /^Using size field when (x|y)-channel has a band scale is not supported\.$/,
    toJa: match => match[1] + ' チャネルが band スケールのとき、size フィールドは使えません。'
  },
  {
    pattern: /^Cannot apply size to non-oriented mark "([^"]+)"\.$/,
    toJa: match => '向きのないマーク "' + match[1] + '" には size を適用できません。'
  },
  {
    pattern: /^rangeStep for "([^"]+)" is dropped as top-level (width|height) is provided\.$/,
    toJa: match => 'トップレベルの ' + match[2] + ' が指定されているため、"' +
      match[1] + '" の rangeStep は除外されました。'
  },
  {
    pattern: /^FieldDef does not work with "([^"]+)" scale\. We are using "([^"]+)" scale instead\.$/,
    toJa: match => 'FieldDef は "' + match[1] + '" スケールと組み合わせられません。代わりに "' +
      match[2] + '" スケールを使います。'
  },
  {
    pattern: /^(\S+)-scale's "([^"]+)" is dropped as it does not work with (\S+) scale\.$/,
    toJa: match => match[1] + ' スケールの "' + match[2] + '" は ' + match[3] +
      ' スケールと組み合わせられないため除外されました。'
  },
  {
    pattern: /^Conflicting (.+) property "([^"]+)" \((.+) and (.+)\)\. {2}Using (.+)\.$/,
    toJa: match => '競合する ' + match[1] + ' プロパティ "' + match[2] + '"（' + match[3] +
      ' と ' + match[4] + '）があります。' + match[5] + ' を使います。'
  },
  {
    pattern: new RegExp(
      '^Setting the scale to be independent for "([^"]+)" means we also have to set ' +
      'the guide \\(axis or legend\\) to be independent\\.$'
    ),
    toJa: match => '"' + match[1] + '" のスケールを独立させる場合、ガイド（軸または凡例）も独立させる必要があります。'
  },
  {
    pattern: /^Cannot set (\S+)-scale's "domain" as it is binned\. Please use "bin"'s "extent" instead\.$/,
    toJa: match => match[1] +
      ' スケールはビン化されているため "domain" を設定できません。代わりに "bin" の "extent" を使ってください。'
  },
  {
    pattern: /^Dropping sort property (.+) as unioned domains only support boolean or op 'count'\.$/,
    toJa: match => '統合ドメインは boolean または演算子 \'count\' のみをサポートするため、sort プロパティ ' +
      match[1] + ' を除外しました。'
  },
  {
    pattern: /^Unable to merge domains$/,
    toJa: () => 'ドメインを統合できません'
  },
  {
    pattern: /^Domains that should be unioned has conflicting sort properties\. Sort will be set to true\.$/,
    toJa: () => '統合すべきドメインの sort プロパティが競合しています。sort は true に設定されます。'
  },
  {
    pattern: /^Invalid channel for axis\.$/,
    toJa: () => '軸に対する不正なチャネルです。'
  },
  {
    pattern: /^Stacking is applied even though the aggregate function is non-summative \("([^"]+)"\)$/,
    toJa: match => '集計関数が加算的でない（"' + match[1] + '"）にもかかわらず、スタックが適用されます'
  },
  {
    pattern: /^Time unit "([^"]+)" is not supported\. We are replacing it with (.+)\.$/,
    toJa: match => '時間単位 "' + match[1] + '" はサポートされていません。' + match[2] + ' に置き換えます。'
  },
  {
    pattern: /^Dropping day from datetime (.+) as day cannot be combined with other units\.$/,
    toJa: match => 'day は他の単位と組み合わせられないため、datetime ' + match[1] + ' から day を除外しました。'
  },
  {
    pattern: /^Invalid ([^:]+): (.+)$/,
    toJa: match => '不正な ' + match[1] + ': ' + match[2]
  },
  {
    pattern: /^Unknown field for \$\{channel\}\. {2}Cannot calculate view size\.$/,
    toJa: () => 'フィールドが不明なため、ビューサイズを計算できません。'
  },
  {
    pattern: /^The same selection must be used to override scale domains in a layered view\.$/,
    toJa: () => 'レイヤービューでスケールドメインを上書きする場合は、同じ選択を使う必要があります。'
  },
  {
    pattern: new RegExp([
      '^Detected faceted independent scales that union domain of multiple fields from different data sources\\.',
      ' {2}We will use the first field\\.',
      ' {2}The result view size may be incorrect\\.$'
    ].join('')),
    toJa: () => '異なるデータソースの複数フィールドのドメインを統合する、ファセットされた独立スケールを検出しました。' +
      '最初のフィールドを使います。結果のビューサイズが正しくないことがあります。'
  },
  {
    pattern: new RegExp([
      '^Detected faceted independent scales that union domain of identical fields from different source detected\\.',
      ' {2}We will assume that this is the same field from a different fork of the same data source\\.',
      ' {2}However, if this is not case, the result view size maybe incorrect\\.$'
    ].join('')),
    toJa: () => '異なるソースの同一フィールドのドメインを統合する、ファセットされた独立スケールを検出しました。' +
      '同一データソースの別フォークの同じフィールドとみなします。そうでない場合、結果のビューサイズが正しくないことがあります。'
  },
  {
    pattern: new RegExp([
      '^Detected faceted independent scales that union domain of multiple fields from the same data source\\.',
      ' {2}We will use the first field\\.',
      ' {2}The result view size may be incorrect\\.$'
    ].join('')),
    toJa: () => '同一データソースの複数フィールドのドメインを統合する、ファセットされた独立スケールを検出しました。' +
      '最初のフィールドを使います。結果のビューサイズが正しくないことがあります。'
  },
  {
    pattern: /^Interval selections only support x and y encoding channels\.$/,
    toJa: () => 'interval 選択は x と y のエンコーディングチャネルのみをサポートします。'
  },
  {
    pattern: /^(.+) is not an ordered event stream for interval selections$/,
    toJa: match => match[1] + ' は interval 選択の順序付きイベントストリームではありません'
  },
  {
    pattern: /^Use "bind": "scales" to setup a binding for scales and selections within the same view\.$/,
    toJa: () => '同一ビュー内でスケールと選択をバインドするには "bind": "scales" を使ってください。'
  },
  {
    pattern: new RegExp(
      '^A "field" or "encoding" must be specified when using a selection as a scale domain\\. ' +
      'Using "field": (.+)\\.$'
    ),
    toJa: match => '選択をスケールドメインとして使う場合は "field" または "encoding" の指定が必要です。"field": ' +
      match[1] + ' を使います。'
  },
  {
    pattern: /^Continuous axis should not have customized aggregation function (.+)$/,
    toJa: match => '連続軸にカスタム集計関数 ' + match[1] + ' を指定しないでください'
  },
  {
    pattern: /^Only use this method with binned field defs$/,
    toJa: () => 'このメソッドはビン化されたフィールド定義でのみ使ってください'
  }
];

export function translateVegaLiteLogToJa(message: string): string {
  for (const rule of RULES) {
    const match = rule.pattern.exec(message);
    if (match) {
      return rule.toJa(match);
    }
  }
  return message;
}

export function localizeLogMessage(message: any): string {
  const text = toLogText(message);
  if (getLocale() !== 'ja') {
    return text;
  }
  return translateVegaLiteLogToJa(text);
}
