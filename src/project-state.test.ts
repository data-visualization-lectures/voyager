import {
  clearCurrentProjectMeta,
  extractThumbnailDataUri,
  getCurrentProjectMeta,
  getProjectDataPayload,
  rememberProjectLoad
} from './project-state';

describe('project-state', () => {
  beforeEach(() => {
    clearCurrentProjectMeta();
  });

  it('extracts a thumbnail data URI from supported project shapes', () => {
    expect(extractThumbnailDataUri({
      data: {
        thumbnailDataUri: 'data:image/png;base64,abc'
      }
    })).toEqual('data:image/png;base64,abc');
  });

  it('unwraps project data and records load metadata', () => {
    const projectPayload: any = {
      dataset: {},
      tableschema: {},
    };

    const result = rememberProjectLoad({
      id: 'outer-id',
      name: 'Outer name',
      thumbnail: 'data:image/png;base64,thumb',
      data: projectPayload
    }, {
      projectId: 'meta-id',
      projectName: 'Meta name'
    });

    expect(result).toBe(projectPayload);
    expect(getProjectDataPayload({data: projectPayload})).toBe(projectPayload);
    expect(result.thumbnailDataUri).toEqual('data:image/png;base64,thumb');
    expect(getCurrentProjectMeta()).toEqual({
      id: 'meta-id',
      name: 'Meta name',
      thumbnailDataUri: 'data:image/png;base64,thumb',
    });
  });
});
