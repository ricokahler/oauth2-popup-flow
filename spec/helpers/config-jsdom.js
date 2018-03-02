const { JSDOM } = require('jsdom');
const jsdom = new JSDOM();
const window = jsdom.window;

global.window = {
  localStorage: {},
  location: {
    hash: '',
    href: '',
  },
  open: () => { },
  btoa: window.btoa.bind(window),
  atob: window.atob.bind(window),
};
