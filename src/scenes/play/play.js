import { Container } from 'pixi.js';
import Mousetrap from 'mousetrap';
import Map, { CellIndex } from 'src/entities/map';
import Cursor, { MODES } from 'src/entities/cursor';

const CURSOR_DIRECTION = {
  NONE: 0,
  LEFT: -1,
  RIGHT: 1,
  UP: -2,
  DOWN: 2,
};
const CURSOR_VELOCITY = {
  SLOW: 0.2,
  NORMAL: 0.7,
  FAST: 2,
};
const OSModeToggleInterval = 7000;

let dynamicViewMode = true;

export default {
  appState: null,
  container: null,
  map: null,
  cursors: [],
  isSafeMode: false,

  setup (app, state) {
    this.appState = state;
    this.container = new Container();
    this.map = Map.instantiate(this.container);

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

    app.ticker.add(cursorTicker);

    // add a random bot
    app.ticker.add(
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
    setInterval(() => Mousetrap.trigger(['j', 'k', 'i', 'l'][Math.round(Math.random() * 4)]), 900);

    Mousetrap.bind('v', () => {
      this.map.position.x = 0;
      this.map.position.y = 0;
      dynamicViewMode = !dynamicViewMode;
    });


    this.toggleOSMode();
    setInterval(() => this.toggleOSMode(), OSModeToggleInterval);

    app.stage.addChild(this.container);
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
    let playTurn = 10;

    Mousetrap.bind(Object.keys(controller), (event, key) => {
      cursor.direction = controller[key];
    });


    this.cursors.push(cursor);

    return () => {
      if (playTurn > 0) {
        playTurn -= cursor.velocity;
        return;
      }

      playTurn = 10;

      this.allocateCurrentCell(cursor);
      this.moveCursor(cursor);
      this.updateCursorVelocity(cursor);
      this.updateCursorMode(cursor);
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
          .to((xIndex, yIndex) => ({ xIndex: xIndex - 1, yIndex }));
        break;
      case CURSOR_DIRECTION.RIGHT:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((xIndex, yIndex) => ({ xIndex: xIndex + 1, yIndex }));
        break;
      case CURSOR_DIRECTION.UP:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((xIndex, yIndex) => ({ xIndex, yIndex: yIndex - 1 }));
        break;
      case CURSOR_DIRECTION.DOWN:
        isTouchedEdge = !this.map
          .move(cursor)
          .to((xIndex, yIndex) => ({ xIndex, yIndex: yIndex + 1 }));
        break;
      default:
    }

    const { x, y } = cursor.getPosition();
    const { xIndex, yIndex } = CellIndex(x, y);

    if (isTouchedEdge) {
      cursor.direction = -cursor.direction;
    }

    if (dynamicViewMode) {
      this.map.position.x = window.innerWidth / 2 - this.cursors[0].position.x;
      this.map.position.y = window.innerHeight / 2 - this.cursors[0].position.y;
    }

    cursor.positionIndex.xIndex = xIndex;
    cursor.positionIndex.yIndex = yIndex;
  },
};
