import {t} from './i18n';
import {
  forgetSpecifiedView,
  getThumbnailDataUri,
  rememberSpecifiedView
} from './thumbnail';

describe('thumbnail', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    rememberSpecifiedView(null);
  });

  it('captures the specified Vega view as a PNG data URI', async () => {
    const view: any = {
      toImageURL: jest.fn(() => Promise.resolve('data:image/png;base64,abc'))
    };

    rememberSpecifiedView(view);

    const thumbnailDataUri = await getThumbnailDataUri();
    expect(thumbnailDataUri).toEqual('data:image/png;base64,abc');
    expect(view.toImageURL).toBeCalledWith('png');
  });

  it('clears the specified Vega view', async () => {
    const view: any = {
      toImageURL: jest.fn(() => Promise.resolve('data:image/png;base64,abc'))
    };

    rememberSpecifiedView(view);
    forgetSpecifiedView(view);

    const thumbnailDataUri = await getThumbnailDataUri();
    expect(thumbnailDataUri).toBeNull();
  });

  it('falls back to an SVG in the specified view pane', async () => {
    document.body.innerHTML = `
      <div>
        <h2>${t('viewPane.specifiedView')}</h2>
        <div class="chart">
          <svg width="10" height="10"><rect width="10" height="10"></rect></svg>
        </div>
      </div>
    `;

    const thumbnailDataUri = await getThumbnailDataUri();
    expect(thumbnailDataUri).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
