/* eslint no-use-before-define: 'off' */

import { Application, loader } from 'pixi.js';
import Mousetrap from 'mousetrap';
import textureAtlas from 'src/assets/sprites/spritesheet.json';
import 'src/assets/sprites/spritesheet.png';
import StartScene from 'src/scenes/start';
import PlayScene from 'src/scenes/play';
import { MAP_BACKGROUND_COLOR_HEX } from 'src/constants';

const app = new Application({
  autoResize: true,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: MAP_BACKGROUND_COLOR_HEX,
});

app.view.id = 'os';
document.body.appendChild(app.view);

loader
  .add(textureAtlas)
  .load(setup);

function setup () {
  StartScene.setup(app);

  Mousetrap.bind('enter', () => {
    Mousetrap.bind('enter');

    PlayScene.setup(app);
    app.stage.removeChild(StartScene.container);
  });
}
