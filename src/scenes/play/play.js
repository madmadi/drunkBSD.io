import { Container, ticker } from 'pixi.js';
import Mousetrap from 'mousetrap';
import Map, { CellIndex } from 'src/entities/map';
import Cursor, { MODES } from 'src/entities/cursor';
import {
  CELL_WIDHT_IN_PX,
  CELL_HEIGHT_IN_PX,
} from 'src/constants';

const CURSOR_DIRECTION = {
  NONE: 0,
  LEFT: -1,
  RIGHT: 1,
  UP: -2,
  DOWN: 2,
};
const CURSOR_VELOCITY = {
  SLOW: 0.5,
  NORMAL: 1,
  FAST: 2,
};
const ERROR_SEGMENTATION_FAULT = new Error('Segmentation Fault');

const OSModeToggleIntervalMS = 7000;
let OSModeToggleInterval = null;


export default {
  appState: null,
  container: null,
  ticker: null,
  map: null,
  cursors: [],
  isSafeMode: false,

  setup (app, state) {
    this.appState = state;
    this.container = new Container();
    this.ticker = new ticker.Ticker();
    this.map = Map.instantiate(this.container);

    this.cursors = [];

    const cursorTicker = this.addNewCursor({
      isPlayer: true,
      tint: 0xFBBC10,
      position: { x: 5000, y: 5000 },
      controller: {
        a: CURSOR_DIRECTION.LEFT,
        s: CURSOR_DIRECTION.DOWN,
        w: CURSOR_DIRECTION.UP,
        d: CURSOR_DIRECTION.RIGHT,
      },
    });

    this.ticker.add(cursorTicker);

    // add a random bot
    this.ticker.add(
      this.addNewCursor({
        tint: 0xEA4335,
        position: { x: 6000, y: 5000 },
        controller: {
          j: CURSOR_DIRECTION.LEFT,
          k: CURSOR_DIRECTION.DOWN,
          i: CURSOR_DIRECTION.UP,
          l: CURSOR_DIRECTION.RIGHT,
        },
      }),
    );
    setInterval(() => Mousetrap.trigger(['j', 'k', 'i', 'l'][Math.round(Math.random() * 4)]), 400);

    this.toggleOSMode();
    OSModeToggleInterval = setInterval(() => this.toggleOSMode(), OSModeToggleIntervalMS);

    app.stage.addChild(this.container);
    this.ticker.start();
  },
  destroy () {
    this.container.parent.removeChild(this.container);
    this.container.destroy();
    this.ticker.stop();

    clearInterval(OSModeToggleInterval);
  },
  addNewCursor ({
    isPlayer,
    position,
    tint,
    controller,
  }) {
    const cursor = Cursor.instantiate(this.map, {
      isPlayer,
      tint,
      position,
      direction: CURSOR_DIRECTION.UP,
      velocity: CURSOR_VELOCITY.NORMAL,
      positionIndex: CellIndex(position.x, position.y),
      allocatedCells: [],
    });

    Mousetrap.bind(Object.keys(controller), (event, key) => {
      cursor.direction = controller[key];
    });

    if (cursor.isPlayer) {
      Mousetrap.bind('shift', () => {
        this.map.move(cursor).align();
      });
    }


    this.cursors.push(cursor);

    return () => {
      this.moveCursor(cursor);
    };
  },
  getRandomColor () {
    const colors = [
      0x34A855,
      0xEA4335,
      0xFBBC10,
      0x4290F4,
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  },
  toggleOSMode () {
    this.isSafeMode = !this.isSafeMode;
    this.appState.osMode = this.isSafeMode ? 'Safe Mode' : 'Parttty Time';
  },
  allocateCurrentCell (cursor) {
    if (this.isAllocatedCell(cursor)) return;
    if (this.map.isAllocatedCell(
      cursor.positionIndex.xIndex,
      cursor.positionIndex.yIndex,
    )
      && this.isSafeMode) {
      if (cursor.isPlayer) {
        // this.appState.error = ERROR_SEGMENTATION_FAULT;
      }

      cursor.direction = -cursor.direction;
      return;
    }

    this.cursors.forEach((c) => {
      const index = c.allocatedCells.indexOf(
        String([cursor.positionIndex.xIndex, cursor.positionIndex.yIndex]),
      );

      if (index === -1) return;

      c.allocatedCells.splice(index, 1);
    });

    this.map.unallocateCell(cursor.positionIndex.xIndex, cursor.positionIndex.yIndex);
    this.map.allocateCell(
      cursor.positionIndex.xIndex,
      cursor.positionIndex.yIndex,
      { tint: cursor.tint },
    );

    cursor.allocatedCells.push(
      String([cursor.positionIndex.xIndex, cursor.positionIndex.yIndex]),
    );

    if (cursor.isPlayer) {
      this.appState.allocatedMemoryByBit = cursor.allocatedCells.length * 8;
    }
  },
  isAllocatedCell ({ allocatedCells, positionIndex }) {
    return allocatedCells.includes(
      String([positionIndex.xIndex, positionIndex.yIndex]),
    );
  },
  updateCursorMode (cursor) {
    if (this.isAllocatedCell(cursor)) {
      cursor.changeMode(MODES.IN_ALLOCATED_CELL);
    } else if (this.map.isAllocatedCell(
      cursor.positionIndex.xIndex,
      cursor.positionIndex.yIndex,
    )) {
      cursor.changeMode(MODES.IS_ALLOCATING);
    } else {
      cursor.changeMode();
    }
  },
  updateCursorVelocity (cursor) {
    if (this.isAllocatedCell(cursor)) {
      cursor.velocity = CURSOR_VELOCITY.FAST;
    } else if (this.map.isAllocatedCell(
      cursor.positionIndex.xIndex,
      cursor.positionIndex.yIndex,
    )) {
      cursor.velocity = CURSOR_VELOCITY.SLOW;
    } else {
      cursor.velocity = CURSOR_VELOCITY.NORMAL;
    }
  },
  moveCursor (cursor) {
    let isTouchedEdge = false;

    switch (cursor.direction) {
      case CURSOR_DIRECTION.LEFT:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((x, y) => ({ x: x - cursor.velocity, y }));
        break;
      case CURSOR_DIRECTION.RIGHT:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((x, y) => ({ x: x + cursor.velocity, y }));
        break;
      case CURSOR_DIRECTION.UP:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((x, y) => ({ x, y: y - cursor.velocity }));
        break;
      case CURSOR_DIRECTION.DOWN:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((x, y) => ({ x, y: y + cursor.velocity }));
        break;
      default:
    }

    const { x, y } = cursor.getPosition();
    const { xIndex, yIndex } = CellIndex(x, y);

    if (isTouchedEdge) {
      if (cursor.isPlayer) {
        this.appState.error = ERROR_SEGMENTATION_FAULT;
      }

      cursor.direction = -cursor.direction;
    }

    if ((cursor.position.x % CELL_WIDHT_IN_PX) < 1
      || (cursor.position.y % CELL_HEIGHT_IN_PX) < 1) {
      this.updateCursorVelocity(cursor);
      this.updateCursorMode(cursor);
      this.allocateCurrentCell(cursor);
    }

    cursor.positionIndex.xIndex = xIndex;
    cursor.positionIndex.yIndex = yIndex;
  },
};
