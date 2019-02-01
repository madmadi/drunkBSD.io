import {
  Container,
  Text,
  TextStyle,
} from 'pixi.js';
import {
  APP_DESCRIPTION,
  APP_TITLE,
} from 'src/constants';

export default {
  container: null,

  setup (app) {
    const container = new Container();

    const fontFamily = 'courier new';
    const fill = 'white';

    const title = new Text(
      APP_TITLE,
      new TextStyle({ fontFamily, fontSize: 64, fill }),
    );
    const description = new Text(
      APP_DESCRIPTION,
      new TextStyle({
        fontFamily,
        fontSize: 24,
        wordWrap: true,
        wordWrapWidth: title.width,
        lineHeight: 35,
        fill,
      }),
    );
    const hint = new Text(
      'Press Enter to continue',
      new TextStyle({ fontFamily, fontSize: 16, fill }),
    );

    title.x = app.screen.width / 2;
    title.y = app.screen.height / 2 - 50;
    title.anchor.x = 0.5;
    description.x = title.x;
    description.y = title.y + 90;
    description.anchor.x = 0.5;
    hint.x = title.x;
    hint.y = description.y + 150;
    hint.anchor.x = 0.5;

    container.addChild(title);
    container.addChild(description);
    container.addChild(hint);

    this.container = container;

    app.stage.addChild(container);
  },
};
