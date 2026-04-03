import {Translations} from './translations';

export const en: Translations = {
  // header
  'header.saveProject': 'Save Project',
  'header.loadProject': 'Load Project',
  'header.notLoggedInSaveLocal': 'You are not logged in. Save as a local file?\n(To save to the cloud, please log in at https://app.dataviz.jp)',
  'header.enterProjectName': 'Enter a project name to save',
  'header.savedToCloud': 'Project saved to cloud!',
  'header.cloudSaveFailed': 'Cloud save failed: {error}',
  'header.projectLoaded': 'Project loaded.',
  'header.projectLoadFailed': 'Failed to load project data.',
  'header.localSaveFailed': 'Failed to save project.',
  'header.notLoggedInLoadLocal': 'You are not logged in. Load from a local file?',
  'header.fileLoadFailed': 'Failed to load project file. Please check the file format.',

  // project-load-modal
  'modal.openCloudProject': 'Open Cloud Project',
  'modal.loading': 'Loading...',
  'modal.noSavedProjects': 'No saved projects.',
  'modal.confirmDelete': 'Delete project "{name}"?',
  'modal.deleteFailed': 'Delete failed: {error}',
  'modal.loadFailed': 'Load failed: {error}',
  'modal.open': 'Open',
  'modal.delete': 'Delete',

  // undo-redo
  'undoRedo.undo': 'Undo',
  'undoRedo.redo': 'Redo',

  // data-pane
  'dataPane.fields': 'Fields',
  'dataPane.wildcardFields': 'Wildcard Fields',
  'dataPane.data': 'Data',
  'dataPane.change': 'Change',

  // encoding-pane
  'encoding.wildcardShelves': 'Wildcard Shelves',
  'encoding.clear': 'Clear',
  'encoding.encoding': 'Encoding',
  'encoding.preview': ' Preview',
  'encoding.mark': 'Mark',
  'encoding.facet': 'Facet',
  'encoding.filter': 'Filter',
  'encoding.dropFieldHere': 'Drop a field here',

  // filter-pane
  'filter.cannotDropHere': 'Cannot drop a field here',
  'filter.dropFieldHere': 'Drop a field here',
  'filter.cannotAddWildcardFilter': 'Cannot add wildcard filter',
  'filter.cannotAddDuplicateFilter': 'Cannot add more than one filter of the same field',
  'filter.keepOnly': 'Keep Only',
  'filter.selectAll': 'Select All',
  'filter.clearAll': 'Clear All',
  'filter.invalidBound': 'Invalid bound',
  'filter.maxCannotBeLessThanMin': 'Maximum bound cannot be smaller than minimum bound',
  'filter.minCannotBeGreaterThanMax': 'Minimum bound cannot be greater than maximum bound',

  // view-pane
  'viewPane.noPlotMessage': 'No specified visualization yet. Start exploring by dragging a field to encoding pane on the left or examining univariate summaries below.',
  'viewPane.specifiedView': 'Specified View',
  'viewPane.relatedViews': 'Related Views',
  'viewPane.groupByAuto': 'Automatic',
  'viewPane.groupByField': 'Field',
  'viewPane.groupByFieldTransform': 'Field and Transformations',
  'viewPane.groupByEncoding': 'Visual Encodings',
  'viewPane.differingBy': 'Showing views with different',
  'viewPane.autoAddCount': 'Auto Add Count',

  // related-views
  'relatedViews.expand': 'Expand',
  'relatedViews.collapse': 'Collapse',
  'relatedViews.specify': 'Specify',

  // data-selector
  'dataSelector.close': 'close',
  'dataSelector.addDataset': 'Add Dataset',
  'dataSelector.changeDataset': 'Change Dataset',
  'dataSelector.pasteOrUpload': 'Paste or Upload Data',
  'dataSelector.fromUrl': 'From URL',
  'dataSelector.file': 'File',
  'dataSelector.uploadInstructions': 'Upload a data file, or paste data in CSV format into the input.',
  'dataSelector.urlInstructions': 'Add the name of the dataset and the URL to a <b>JSON</b>, <b>CSV</b> (with header), or <b>TSV</b> file. Make sure that the formatting is correct and clean the data before adding it. The added dataset is only visible to you.',
  'dataSelector.fileType': 'File Type',
  'dataSelector.name': 'Name',
  'dataSelector.url': 'URL',
  'dataSelector.addDatasetButton': 'Add Dataset',
  'dataSelector.addData': 'Add Data',

  // load-data-pane
  'loadData.loadDataOrProject': 'Please load a dataset',
  'loadData.loadButton': 'Load',
  'loadData.loadDatasetElectron': 'Please load a dataset. (For the Electron app, please use the menu bar.)',

  // bookmark
  'bookmark.bookmarkWithCount': 'Bookmarks ({count})',
  'bookmark.clearAll': 'Clear all',
  'bookmark.export': 'Export',
  'bookmark.noBookmarks': 'You have no bookmarks',
  'bookmark.close': 'Close',

  // plot
  'plot.sort': 'Sort',
  'plot.specify': 'Specify',
  'plot.copy': 'Copy',
  'plot.copied': 'copied',

  // plot-list
  'plotList.loadMore': 'Load more...',

  // footer
  'footer.downloadLogs': 'Download logs',

  // function-picker
  'functionPicker.wildcard': 'Wildcard',
  'functionPicker.function': 'Function',

  // type-changer
  'typeChanger.type': 'Type',
};
