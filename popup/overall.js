(function(){
  function getOverallText(){
    browser.runtime.sendMessage({request:"send overall"},function (response) {
      document.getElementById("overall").value=response;
    });
  }

  function closeWin(){
    window.close();
  }

  function init(){
    document.getElementById("ok_button").addEventListener("click",closeWin);
    getOverallText();
  }
  window.addEventListener('DOMContentLoaded',init);
})();
