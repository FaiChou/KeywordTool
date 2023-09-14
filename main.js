// ==UserScript==
// @name         KeywordTool
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       FaiChou
// @match        https://keywordtool.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=stackoverflow.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  function downloadText(text, title) {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${title}.txt`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
  }
  function insertNewline(str, position) {
    let output = '';
    for(let i = 0; i < str.length; i++) {
      output += str[i];
      if ((i + 1) % position === 0) {
        output += '\n\n';
      }
    }
    return output;
  }
  function run() {
      // const fetch = window.fetch;
      // window.fetch = (...args) => (async(args) => {
      //   var result = await fetch(...args);
      //   console.log("intercept response:", result);
      //   return result;
      // })(args);
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          this._url = url;
          this.addEventListener('load', function() {
              const regex = /https:\/\/keywordtool\.io\/search\/keywords\/(.+)\/metrics(.*)/;
              const match = this._url.match(regex);
              if (match) {
                  console.log('URL: ' + this._url);
                  const title = match[1]+Date.now();
                  const data = JSON.parse(this.responseText);
                  const all_keywords = data.all_keywords;
                  let result = all_keywords.map(item => item).join(',');
                  result = insertNewline(result, 299);
                  downloadText(result, title);
              }
          });
          origOpen.apply(this, arguments);
      };
  }
  setTimeout(() => {
      run();
  }, 100);
  let oldPushState = history.pushState;
  history.pushState = function pushState() {
      let ret = oldPushState.apply(this, arguments);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
  };
  let oldReplaceState = history.replaceState;
  history.replaceState = function replaceState() {
      let ret = oldReplaceState.apply(this, arguments);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
  };
  window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
  });
  window.addEventListener('locationchange', function () {
      setTimeout(() => {
          run();
      }, 100);
  });
})();
