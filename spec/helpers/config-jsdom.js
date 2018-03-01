const { JSDOM } = require('jsdom');
const jsdom = new JSDOM();

global.window = jsdom.window;
global.document = jsdom.window.document;
