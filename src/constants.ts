import { VoyagerConfig } from './models/config';

export const HISTORY_LIMIT = 20;

export const PLOT_HOVER_MIN_DURATION = 500;

/**
 * Types of draggable items (for react-dnd).
 */
export const DraggableType = {
  FIELD: 'field'
};

/**
 * Type of parent for Field Component
 */
export enum FieldParentType {
  ENCODING_SHELF,
  FIELD_LIST
};

export const SPINNER_COLOR = '#4C78A8';

const SERVER = process.env.SERVER;

export const VOYAGER_CONFIG: VoyagerConfig = {
  showDataSourceSelector: true,
  serverUrl: SERVER
};
