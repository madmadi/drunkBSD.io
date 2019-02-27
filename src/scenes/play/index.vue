<template>
  <div>
    <template v-if='!error'>
      <div class='header'>
        <div style='float:right'>
          <p>KiB Mem <b>{{ allocatedMemoryByKiB }}</b></p>
          <p>USER <b>{{ username }}</b></p>
        </div>
        <p>OS MODE <b>{{ osMode }}</b></p>
      </div>
      <div
        v-show='!error'
        id='os'
        ref='container'
      />
    </template>
    <div
      v-else
      class='error'
    >
      <p>:(</p>
      <p v-text='error' />
      <p>you crashed!</p>
      <small>rebooting...</small>
    </div>
  </div>
</template>

<script>
import { Application, loader } from 'pixi.js';
import textureAtlas from 'src/assets/sprites/spritesheet.json';
import { MAP_BACKGROUND_COLOR_HEX } from 'src/constants';
import game from './play';
import 'src/assets/sprites/spritesheet.png';


export default {
  name: 'PlayScene',
  data () {
    return {
      app: null,
      error: null,
      username: localStorage.getItem('username'),
      allocatedMemoryByBit: 0,
      osMode: 'Running ...',
      isLoading: true,
    };
  },
  computed: {
    allocatedMemoryByKiB () {
      return (this.allocatedMemoryByBit / 1024).toFixed(3);
    },
  },
  watch: {
    error () {
      if (this.allocatedMemoryByKiB > localStorage.getItem('highscore')) {
        localStorage.setItem('highscore', this.allocatedMemoryByKiB);
      }

      setTimeout(() => this.$emit('scene', 'StartScene'), 3000);
    },
  },
  created () {
    this.app = new Application({
      autoResize: true,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: MAP_BACKGROUND_COLOR_HEX,
    });
  },
  mounted () {
    this.isLoading = true;

    this.$refs.container.appendChild(this.app.view);

    if (!loader.resources[textureAtlas]) {
      loader
        .add(textureAtlas)
        .load(this.play);
    } else {
      this.play();
    }
  },
  destroyed () {
    game.destroy();
  },
  methods: {
    play () {
      game.setup(this.app, this.$data);
      this.isLoading = false;
    },
  },
};
</script>

<style>
#os {
  display: block;
  margin: 0 auto;
}
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 5px 20px;
  color: #0f0;
  background-color: black;
}
.header * {
  display: inline;
  margin: 0 5px;
}
.error {
  color: #f00;
  text-align: center;
}
</style>
