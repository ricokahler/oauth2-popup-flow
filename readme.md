# OAuth2 Popup Flow · [![Build Status](https://travis-ci.org/ricokahler/oauth2-popup-flow.svg?branch=master)](https://travis-ci.org/ricokahler/oauth2-popup-flow) [![Coverage Status](https://coveralls.io/repos/github/ricokahler/oauth2-popup-flow/badge.svg?branch=master)](https://coveralls.io/github/ricokahler/oauth2-popup-flow?branch=master)

> A very simple oauth2 implicit flow library with no dependencies that uses `window.open`.

## An OAuth2 for a specialized use-case

# Requirements

* [`String.prototype.startsWith`][0] (you may need a polyfill if you're targeing IE etc)

[0]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith