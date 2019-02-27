import { Sprite, utils } from 'pixi.js';
import Entity, { SPRITE_TYPES } from 'src/models/Entity';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  CELL_WIDHT_IN_PX,
  CELL_HEIGHT_IN_PX,
} from 'src/constants';

const MAX_HORIZONTAL_CELL = MAP_WIDTH / CELL_WIDHT_IN_PX;
const MAX_VERTICAL_CELL = MAP_HEIGHT / CELL_HEIGHT_IN_PX;
const cellTexture = 'cell.png';
const allocatedCellTexture = 'allocatedCell.png';

export function CellIndex (x, y) {
  return {
    xIndex: Math.floor(x / CELL_WIDHT_IN_PX),
    yIndex: Math.floor(y / CELL_HEIGHT_IN_PX),
  };
}

export function CellPosition (xIndex, yIndex) {
  return {
    x: xIndex * CELL_WIDHT_IN_PX,
    y: yIndex * CELL_WIDHT_IN_PX,
  };
}

export default Entity({
  texture: cellTexture,
  sprite: {},
  spriteType: SPRITE_TYPES.TILING,
  states: {
    position: { x: 0, y: 0 },
    allocatedCells: [],
  },

  setup () {
    this.sprite.width = MAP_WIDTH;
    this.sprite.height = MAP_HEIGHT;
  },

  methods: {
    move (entity) {
      return {
        to: (destFn) => {
          const position = entity.getPosition();
          const cell = CellIndex(position.x, position.y);
          const { xIndex, yIndex } = destFn(cell.xIndex, cell.yIndex);

          if (xIndex < 0 || xIndex >= MAX_HORIZONTAL_CELL
            || yIndex < 0 || yIndex >= MAX_VERTICAL_CELL) {
            return false;
          }

          const { x, y } = CellPosition(xIndex, yIndex);

          entity.move(x, y);

          if (entity.isPlayer) {
            this.position.x = window.innerWidth / 2 - entity.position.x;
            this.position.y = window.innerHeight / 2 - entity.position.y;
          }

          return true;
        },
      };
    },
    allocateCell (xIndex, yIndex, { tint }) {
      const allocatedCellSprite = new Sprite(utils.TextureCache[allocatedCellTexture]);
      const { x, y } = CellPosition(xIndex, yIndex);

      allocatedCellSprite.position.x = x;
      allocatedCellSprite.position.y = y;
      allocatedCellSprite.tint = tint || 0xFFFFFF;
      allocatedCellSprite.cellId = this.getCellId(xIndex, yIndex);

      this.allocatedCells.push(this.getCellId(xIndex, yIndex));
      this.sprite.addChild(allocatedCellSprite);
    },
    unallocateCell (xIndex, yIndex) {
      const index = this.allocatedCells.indexOf(this.getCellId(xIndex, yIndex));
      const child = this.sprite.children
        .find(c => c.cellId === this.getCellId(xIndex, yIndex));

      if (index === -1) return;

      this.allocatedCells.splice(index, 1);
      this.sprite.removeChild(child);
    },
    getCellId (xIndex, yIndex) {
      return String([xIndex, yIndex]);
    },
    isAllocatedCell (xIndex, yIndex) {
      return this.allocatedCells.includes(this.getCellId(xIndex, yIndex));
    },
  },
});
