(function(){
  var mainURL = browser.runtime.getURL("popup/main.html");
  const region = {
    "011000" : ["宗谷地方"],
    "012000" : ["上川地方","留萌地方"],
    "013000" : ["網走地方","北見地方","紋別地方"],
    "014100" : ["釧路地方","根室地方","十勝地方"],
    "015000" : ["胆振地方","日高地方"],
    "016000" : ["石狩地方","空知地方","後志地方"],
    "017000" : ["渡島地方","檜山地方"],
    "020000" : ["津軽","下北","三八上北"],
    "030000" : ["北部","南部"],
    "040000" : ["東部","西部"],
    "050000" : ["沿岸","内陸"],
    "060000" : ["村山","置賜","庄内","最上"],
    "070000" : ["中通り","浜通り","会津"],
    "080000" : ["北部","南部"],
    "090000" : ["南部","北部"],
    "100000" : ["南部","北部"],
    "110000" : ["北部","南部","秩父地方"],
    "120000" : ["北西部","北東部","南部"],
    "130000" : ["東京地方","伊豆諸島北部","伊豆諸島南部","小笠原諸島"],
    "140000" : ["東部","西部"],
    "150000" : ["下越","中越","上越","佐渡"],
    "160000" : ["東部","西部"],
    "170000" : ["加賀","能登"],
    "180000" : ["嶺北","嶺南"],
    "190000" : ["中・西部","東部・富士五湖"],
    "200000" : ["北部","中部","南部"],
    "210000" : ["美濃地方","飛騨地方"],
    "220000" : ["中部","西部","東部","伊豆"],
    "230000" : ["西部","東部"],
    "240000" : ["北中部","南部"],
    "250000" : ["南部","北部"],
    "260000" : ["南部","北部"],
    "270000" : ["大阪府"],
    "280000" : ["南部","北部"],
    "290000" : ["北部","南部"],
    "300000" : ["北部","南部"],
    "310000" : ["東部","中・西部"],
    "320000" : ["東部","西部","隠岐"],
    "330000" : ["南部","北部"],
    "340000" : ["南部","北部"],
    "350000" : ["西部","中部","東部","北部"],
    "360000" : ["北部","南部"],
    "370000" : ["香川県"],
    "380000" : ["中予","東予","南予"],
    "390000" : ["中部","東部","西部"],
    "400000" : ["福岡地方","北九州地方","筑豊地方","筑後地方"],
    "410000" : ["南部","北部"],
    "420000" : ["南部","北部","壱岐・対馬","五島"],
    "430000" : ["熊本地方","阿蘇地方","天草・芦北地方","球磨地方"],
    "440000" : ["中部","北部","西部","南部"],
    "450000" : ["南部平野部","北部平野部","南部山沿い","北部山沿い"],
    "460100" : ["薩摩地方","大隅地方","種子島・屋久島地方","奄美地方"],
    "471000" : ["本島中南部","本島北部","久米島"],
    "472000" : ["大東島地方"],
    "473000" : ["宮古島地方"],
    "474000" : ["石垣島地方","与那国島地方"]
  };

  function setItem() {
    browser.runtime.sendMessage({status:"set location"});
    window.close();
  }

  function onError(error) {
    console.error(error);
    window.close();
  }

  function onOK(){
    var elmPref = document.getElementById('pref_list');
    var elmReg  = document.getElementById('reg_list');
    browser.storage.local.set(
      {"location":{"prefecture":elmPref.value,"region":elmReg.value}}
    ).then(setItem, onError);
  }

  function onCancel(){
    window.close();
  }

  function dispRegionList(prefecture){
    var elm = document.getElementById('reg_list');
    var cnt = region[prefecture].length;
    var optionElm;
    var textNode;

    for(i=0; i<cnt; i++){
      optionElm = document.createElement('option');
      textNode  = document.createTextNode(region[prefecture][i]);
      optionElm.appendChild(textNode);
      elm.appendChild(optionElm);
    }
  }

  function clearRegion(){
    let cnt = document.getElementById('reg_list').childNodes.length;
    for(i=0; i<cnt; i++){
      var elm = document.getElementById('reg_list');
      elm.remove(0);
    }
  }

  function redrawRegion(){
    var elm = document.getElementById('pref_list');
    clearRegion();
    dispRegionList(elm.value);
  }

  function init(){
    document.getElementById('pref_list').addEventListener("change", redrawRegion);
    document.getElementById('ok_button').addEventListener("click",onOK);
    document.getElementById('cancel_button').addEventListener("click",onCancel);
    var elm = document.getElementById('pref_list');
    dispRegionList(elm.value);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
