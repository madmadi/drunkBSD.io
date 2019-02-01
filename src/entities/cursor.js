import Entity from 'src/models/entity';

const cursorTexture = 'cursor.png';
const cursorAllocatedTexture = 'cursorInAllocatedCell.png';
const allocatingCursorTexture = 'allocatingCursor.png';

export const MODES = {
  IN_ALLOCATED_CELL: 0,
  IS_ALLOCATING: 1,
};

export default Entity({
  texture: cursorTexture,
  sprite: null,
  states: {
    position: { x: 0, y: 0 },
    tint: Math.random() * 0xFFFFFF,
  },

  setup ({ tint } = {}) {
    if (tint) {
      this.tint = tint;
    }

    this.sprite.zIndex = 1;
    this.sprite.tint = this.tint;
  },

  methods: {
    changeMode (mode) {
      switch (mode) {
        case MODES.IN_ALLOCATED_CELL:
          this.changeTexture(cursorAllocatedTexture);
          break;
        case MODES.IS_ALLOCATING:
          this.changeTexture(allocatingCursorTexture);
          break;
        default:
          this.changeTexture(cursorTexture);
      }
    },
  },
});
