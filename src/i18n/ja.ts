import {Translations} from './translations';

export const ja: Translations = {
  'processing.projectList': 'プロジェクト一覧を読み込み中です',
  'processing.projectLoad': 'プロジェクトを読み込み中です',
  'processing.projectSave': 'プロジェクトを保存中です',
  'processing.savePrep': '保存準備中です',
  'processing.sample': 'サンプルデータを読み込み中です',

  // undo-redo
  'undoRedo.undo': '元に戻す',
  'undoRedo.redo': 'やり直す',

  // data-pane
  'dataPane.fields': 'フィールド',
  'dataPane.wildcardFields': 'ワイルドカードフィールド',
  'dataPane.data': 'データ',
  'dataPane.change': '変更',

  // encoding-pane
  'encoding.wildcardShelves': 'ワイルドカードシェルフ',
  'encoding.clear': 'クリア',
  'encoding.encoding': 'エンコーディング',
  'encoding.preview': ' プレビュー',
  'encoding.mark': 'マーク',
  'encoding.facet': 'ファセット',
  'encoding.filter': 'フィルター',
  'encoding.dropFieldHere': 'フィールドをここにドロップ',

  // filter-pane
  'filter.cannotDropHere': 'ここにフィールドをドロップできません',
  'filter.dropFieldHere': 'フィールドをここにドロップ',
  'filter.cannotAddWildcardFilter': 'ワイルドカードフィルターは追加できません',
  'filter.cannotAddDuplicateFilter': '同一フィールドのフィルターを複数追加できません',
  'filter.keepOnly': '選択のみ保持',
  'filter.selectAll': 'すべて選択',
  'filter.clearAll': 'すべてクリア',
  'filter.invalidBound': '無効な範囲',
  'filter.maxCannotBeLessThanMin': '最大値は最小値より小さくできません',
  'filter.minCannotBeGreaterThanMax': '最小値は最大値より大きくできません',

  // view-pane
  'viewPane.noPlotMessage': 'まだ可視化が指定されていません。左側のエンコーディングペインにフィールドをドラッグするか、下の単変量サマリーを確認して探索を開始してください。',
  'viewPane.specifiedView': '指定されたビュー',
  'viewPane.relatedViews': '関連ビュー',
  'viewPane.groupByAuto': '自動',
  'viewPane.groupByField': 'フィールド',
  'viewPane.groupByFieldTransform': 'フィールドと変換',
  'viewPane.groupByEncoding': 'ビジュアルエンコーディング',
  'viewPane.differingBy': '異なる',
  'viewPane.autoAddCount': '自動的にカウントを追加',

  // related-views
  'relatedViews.expand': '展開',
  'relatedViews.collapse': '折りたたむ',
  'relatedViews.specify': '指定',

  // data-selector
  'dataSelector.close': '閉じる',
  'dataSelector.addDataset': 'データセットを追加',
  'dataSelector.pasteOrUpload': 'データを貼り付けまたはアップロード',
  'dataSelector.fromUrl': 'URLから',
  'dataSelector.file': 'ファイル',
  'dataSelector.uploadInstructions': 'データファイルをアップロードするか、CSV形式のデータを入力欄に貼り付けてください。',
  'dataSelector.urlInstructions': 'データセットの名前と、<b> JSON </b>、<b> CSV </b>（ヘッダー付き）、または<b> TSV </b>ファイルへのURLを追加してください。フォーマットが正しいことを確認し、追加する前にデータをクリーンアップしてください。追加されたデータセットはあなただけに表示されます。',
  'dataSelector.fileType': 'ファイルタイプ',
  'dataSelector.name': '名前',
  'dataSelector.url': 'URL',
  'dataSelector.addDatasetButton': 'データセットを追加',
  'dataSelector.addData': 'データを追加',

  // load-data-pane
  'loadData.loadDataOrProject': 'データもしくはプロジェクトを読み込んでください',
  'loadData.loadButton': '読み込む',
  'loadData.loadDatasetElectron': 'データセットを読み込んでください。（Electronアプリの場合は、メニューバーを使用してください。）',

  // bookmark
  'bookmark.bookmarkWithCount': 'ブックマーク ({count})',
  'bookmark.clearAll': 'すべてクリア',
  'bookmark.export': 'エクスポート',
  'bookmark.noBookmarks': 'ブックマークがありません',
  'bookmark.close': '閉じる',

  // plot
  'plot.sort': '並べ替え',
  'plot.specify': '指定',
  'plot.copy': 'コピー',
  'plot.copied': 'コピーしました',

  // plot-list
  'plotList.loadMore': 'さらに読み込む...',

  // footer
  'footer.downloadLogs': 'ログをダウンロード',

  // function-picker
  'functionPicker.wildcard': 'ワイルドカード',
  'functionPicker.function': '関数',

  // type-changer
  'typeChanger.type': '型',
};
