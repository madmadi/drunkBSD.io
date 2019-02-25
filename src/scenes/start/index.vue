<template>
  <div>
    <div
      ref='terminal'
      class='terminal'
      @click='$refs.command.focus()'
    >
      <p class='logo'>🍷</p>
      <pre class='title'>
██████╗ ██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗██████╗ ███████╗██████╗    ██╗ ██████╗
██╔══██╗██╔══██╗██║   ██║████╗  ██║██║ ██╔╝██╔══██╗██╔════╝██╔══██╗   ██║██╔═══██╗
██║  ██║██████╔╝██║   ██║██╔██╗ ██║█████╔╝ ██████╔╝███████╗██║  ██║   ██║██║   ██║
██║  ██║██╔══██╗██║   ██║██║╚██╗██║██╔═██╗ ██╔══██╗╚════██║██║  ██║   ██║██║   ██║
██████╔╝██║  ██║╚██████╔╝██║ ╚████║██║  ██╗██████╔╝███████║██████╔╝██╗██║╚██████╔╝
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═════╝ ╚═╝╚═╝ ╚═════╝
      </pre>
      <p class='description'>
        DrunkBSD {{ $root.version }} - The Game
        <br>
        Battle of dying programs inside a corrupted BSD distro to keep itself running
      </p>
      <p class='description'>
        Hint:
        <br>
        run ./program executable to start the game (make your own program alive)
        <br>
        run help command for more information
      </p>
      <div
        v-for='({ id, text, result }) in executedCommands'
        :key='id'
        class='command'
      >
        <span
          class='prompt'
          v-html='prompt'
        />
        <input
          disabled
          class='command__input'
          :value='text'
        >
        <p
          class='result'
          v-html='result'
        />
      </div>
      <div class='command'>
        <span
          class='prompt'
          v-html='prompt'
        />
        <input
          ref='command'
          v-model='command'
          type='text'
          class='command__input'
          maxlength='50'
          autofocus
          @keyup.enter='exec'
        >
      </div>
    </div>
  </div>
</template>

<script>
const USERNAME_GUEST = 'guest';

const TerminalCommands = {
  su: {
    desc: 'set username | su john',
    exec (username) {
      if (!username || username.includes(' ')) return 'Invalid username';

      localStorage.setItem('username', username);
      this.username = username;

      return `Welcome ${this.username}`;
    },
  },
  whoami: {
    desc: 'print effective userid',
    exec () {
      return this.username;
    },
  },
  highscore: {
    desc: 'print your high score',
    exec () {
      const highscore = localStorage.getItem('highscore');

      if (!highscore) {
        return `no record found for ${this.username}`;
      }

      return `highscore: killed while ${highscore}KiB memory was allocated`;
    },
  },
  logout: {
    desc: 'logout user',
    exec () {
      if (this.isGuestUser) return 'You are not logged in';

      const { username } = this;

      localStorage.removeItem('username');
      this.username = USERNAME_GUEST;

      return `Bye ${username}`;
    },
  },
  version: {
    desc: 'get OS version',
    exec () { return this.version; },
  },
  clear: {
    desc: 'clear the terminal screen',
    exec () {
      this.$nextTick(() => {
        this.executedCommands = [];
      });
    },
  },
  help: {
    desc: 'list available commands',
    exec () {
      return `
      DrunkBSD ${this.version}

      Available commands:
      ${Object.keys(TerminalCommands).map((c, i) => `${i + 1}) <b>${c}</b> - ${TerminalCommands[c].desc}`).join('\n')}
      `;
    },
  },
};

export default {
  name: 'StartScene',
  data () {
    return {
      username: localStorage.getItem('username') || USERNAME_GUEST,
      command: '',
      executedCommands: [],
    };
  },
  computed: {
    prompt () {
      return `[${this.username}@drunkBSD /bin/]<br>$`;
    },
    isGuestUser () {
      return this.username === USERNAME_GUEST;
    },
    version () {
      return this.$root.version;
    },
  },
  methods: {
    exec () {
      const [command, ...args] = this.command.split(' ');
      let result = `command not found: ${this.command}`;

      if (command === './program') {
        this.goToPlay();
        return;
      }

      if (TerminalCommands[command]) {
        result = TerminalCommands[command].exec.call(this, args.join(' ')) || '';
      }

      result = result.replace(/\n/g, '<br>');

      this.executedCommands.push({
        id: this.executedCommands.length,
        text: this.command,
        result,
      });

      this.command = '';

      this.$nextTick(() => {
        this.$refs.terminal.scrollTop = this.$refs.terminal.scrollHeight;
      });
    },
    goToPlay () {
      if (this.isGuestUser) {
        return 'Be sure to set your username using `su` command, `help` for more info';
      }

      this.$emit('scene', 'PlayScene');

      return true;
    },
  },
};
</script>

<style>
.logo {
  float: right;
  font-size: 4rem;
  margin: 0;
}
.title {
  font-size: .5rem;
}
.description {
  font-style: italic;
}
.terminal {
  max-width: 768px;
  height: 80vh;
  margin: 0 auto;
  padding: 20px;
  font-size: 1.2rem;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: auto;
}
.command {
  margin: 0 0 20px 0;
}
.command__input {
  width: calc(100% - 212px);
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background-color: transparent;
  border: none;
}
.description,
.result {
  font-size: .9rem;
  color: #bbb;
}
</style>
