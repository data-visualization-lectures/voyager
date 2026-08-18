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
