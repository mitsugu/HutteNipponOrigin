(function(){
  const urlJmaRegular   = 'http://www.data.jma.go.jp/developer/xml/feed/regular.xml';
  const urlJmaRegularL  = 'http://www.data.jma.go.jp/developer/xml/feed/regular_l.xml';
  let   jmaRegularXML;
  let   jmaWeeklyXML;
  var   locationURL     = browser.runtime.getURL("popup/location.html");
  var   overallURL      = browser.runtime.getURL("popup/overall.html");
  // 日毎府県天気予報データ
  let day = {
    date    : "", // 日付
    dow     : "", // 曜日
    weather : "", // 天気文字列
    wcode   : "", // 天気コード
    temps   : [], // 最高気温/最低気温
    probs   : []  // 降水確率
  };

  // 府県天気予報
  let forcast = {
    date        : "",
    prefecture  : "",   // 地域コード
    region      : "",   // 地方(ex. 北部、南部等
    overall     : "",   // 府県天気概況
    days        : []    // 日別府県天気予報データ
  };

  var hutteNippon={};
  hutteNippon.prefecture="";    // 都道府県
  hutteNippon.weatherData = {}; // 府県天気予報 XML
  var idWinLocation;
  // {{{
  const pref = {
    "010000" : "気象庁",
    "011000" : "北海道",
    "012000" : "北海道",
    "013000" : "北海道",
    "014100" : "北海道",
    "015000" : "北海道",
    "016000" : "北海道",
    "017000" : "北海道",
    "020000" : "青森県",
    "030000" : "岩手県",
    "040000" : "宮城県",
    "050000" : "秋田県",
    "060000" : "山形県",
    "070000" : "福島県",
    "080000" : "茨城県",
    "090000" : "栃木県",
    "100000" : "群馬県",
    "110000" : "埼玉県",
    "120000" : "千葉県",
    "130000" : "東京都",
    "140000" : "神奈川県",
    "150000" : "新潟県",
    "160000" : "富山県",
    "170000" : "石川県",
    "180000" : "福井県",
    "190000" : "山梨県",
    "200000" : "長野県",
    "210000" : "岐阜県",
    "220000" : "静岡県",
    "230000" : "愛知県",
    "240000" : "三重県",
    "250000" : "滋賀県",
    "260000" : "京都府",
    "270000" : "大阪府",
    "280000" : "兵庫県",
    "290000" : "奈良県",
    "300000" : "和歌山県",
    "310000" : "鳥取県",
    "320000" : "島根県",
    "330000" : "岡山県",
    "340000" : "広島県",
    "350000" : "山口県",
    "360000" : "徳島県",
    "370000" : "香川県",
    "380000" : "愛媛県",
    "390000" : "高知県",
    "400000" : "福岡県",
    "410000" : "佐賀県",
    "420000" : "長崎県",
    "430000" : "熊本県",
    "440000" : "大分県",
    "450000" : "宮崎県",
    "460100" : "鹿児島県",
    "471000" : "沖縄県",
    "472000" : "沖縄県",
    "473000" : "沖縄県",
    "474000" : "沖縄県"
  };
  // }}}

  function evaluateXPath(prefix, aNode, aExpr) {
    // {{{
    // var elms=evaluateXPath(documentNode, '//myns:entry');
    // See URL for xpath expressions
    // https://developer.mozilla.org/ja/docs/Web/XPath/Introduction_to_using_XPath_in_JavaScript#implementing_a_user_defined_namespace_resolver
    var resolver = function(prefix) {
      var ns = {
        'html'        : 'http://www.w3.org/1999/xhtml',
        'regular'     : 'http://www.w3.org/2005/Atom',
        'overallhead' : 'http://xml.kishou.go.jp/jmaxml1/informationBasis1/',
        'overall'     : 'http://xml.kishou.go.jp/jmaxml1/body/meteorology1/',
        'rtd'         : 'http://xml.kishou.go.jp/jmaxml1/',
        'bdd'         : 'http://xml.kishou.go.jp/jmaxml1/body/meteorology1/',
        'jmx_eb'      : 'http://xml.kishou.go.jp/jmaxml1/elementBasis1/',
        'rtw'         : 'http://xml.kishou.go.jp/jmaxml1/',
        'bdw'         : 'http://xml.kishou.go.jp/jmaxml1/body/meteorology1/'
      };
      return ns[prefix] || null;
    };
    var result = aNode.evaluate(
      aExpr,
      aNode,
      resolver,
      XPathResult.ANY_TYPE,
      null
    );

    var found = [];
    var res;
    while (res = result.iterateNext()){
      found.push(res);
    }
    return found;
    // }}}
  }

  function dispLocationButtonLavel(){
    // {{{
    var elm       = document.getElementById('locationButton');
    var textNode  = document.createTextNode(
      hutteNippon.prefecture + ' ( ' + hutteNippon.region + ' ) の週間天気予報'
    );
    if(elm.childNodes.length>0){
      elm.removeChild(elm.childNodes.item(0));
    }
    elm.appendChild(textNode);
    // }}}
  }

  function dispProbs(pDate){
    // {{{
    let strExp    = '//div[@id="day'
                  + pDate
                  +'"]//div[@class="probability_box"]/span';
    let elms      = evaluateXPath('html', document,strExp);
    let maxProbs  = hutteNippon.weatherData.days[pDate].probs.length;
    let str = '';
    for(var i=0;i<maxProbs;i++){
      str += hutteNippon.weatherData.days[pDate].probs[i];
      if(i<(maxProbs-1)) str += '/';
    }
    elms[0].appendChild(document.createTextNode(str));
    // }}}
  }

  function dispTemps(pDate){
    // {{{
    let str   = '';
    let strExp, elms;
    for(var i=0;i<2;i++){
      str = hutteNippon.weatherData.days[pDate].temps[i];
      strExp  = '//div[@id="day'
              + pDate
              +'"]//div[@class="temperature_box"]/span['+(2+i)+']';
      elms    = evaluateXPath('html', document,strExp);
      elms[0].appendChild(document.createTextNode(str));
    }
    // }}}
  }

  function dispIconWeather(pDate){
    // {{{
    let strExp  = '//div[@id="day'
                + pDate
                +'"]//div[@class="weather_icon_box"]/img';
    let elms    = evaluateXPath('html', document,strExp);
    let url     =browser.runtime.getURL('icons/'
                    +hutteNippon.weatherData.days[pDate].wcode
                    +'.png');
    if(elms.length){
      elms[0].setAttribute('style',"width:60px;height:26px;visibility:visible;");
      elms[0].setAttribute('src',url)
    }
    // }}}
  }

  function dispStrWeather(pDate){
    // {{{
    let strExp  = '//div[@id="day'
                + pDate
                +'"]//div[@class="weather_icon_box"]/span';
    let elms    = evaluateXPath('html', document,strExp);
    if(elms.length){
      elms[0].appendChild(
        document.createTextNode(
          hutteNippon.weatherData.days[pDate].weather
        )
      )
    }
    // }}}
  }

  function dispDate(pDate){
    // {{{
    let strExp  = '//div[@id="day'
                + pDate
                +'"]//div[@class="date_box"]/span';
    let elms    = evaluateXPath('html', document,strExp);
    if(elms.length){
      elms[0].appendChild(
        document.createTextNode(
          hutteNippon.weatherData.days[pDate].date
        )
      )
      if ( hutteNippon.weatherData.days[pDate].dow == 6 ) {
        elms[0].setAttribute( "style", "color:blue;" );
      } else if ( hutteNippon.weatherData.days[pDate].dow == 0 ) {
        elms[0].setAttribute( "style", "color:red" );
      } else {
        elms[0].setAttribute( "style", "colro:black" );
      }
    }
    // }}}
  }

  function dispContentsWeather(){
    // {{{
    let maxDays = hutteNippon.weatherData.days.length;
    for(var i=0;i<maxDays;i++){
      dispDate(i);
      dispStrWeather(i);
      dispIconWeather(i);
      dispTemps(i);
      dispProbs(i);
    }
    // }}}
  }

  function clearContentsWeather(){
    // {{{
    let strXPath;
    let elms;

    for (var i=0; i<8; i++) {
      // 日付
      strXPath = '//div[@id="day'+i+'"]//span[@class="date"]';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].textContent= "";
      // 天気文字列
      strXPath = '//div[@id="day'+i+'"]/div[@class="weather_icon_box"]/span';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].textContent= "";
      // 天気アイコン
      strXPath = '//div[@id="day'+i+'"]/div[@class="weather_icon_box"]/img';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].setAttribute('src',"");
      elms[0].setAttribute('style',"visibility:hidden;");
      // 最低温度
      strXPath  = '//div[@id="day'
                +i
                +'"]/div[@class="temperature_box"]/span[@class="lowTemp"]';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].textContent= "";
      // 最高温度
      strXPath  = '//div[@id="day'
                +i
                +'"]/div[@class="temperature_box"]/span[@class="heighTemp"]';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].textContent= "";
      // 降水確率
      strXPath = '//div[@id="day'+i+'"]/div[@class="probability_box"]/span';
      elms= evaluateXPath('html', document, strXPath);
      elms[0].textContent= "";
    }
    // }}}
  }

  function getUrlDaily(){
    // {{{
    let strExp  = "";
    let elms;
    let strDate = forcast.date;
    let cnt = 0;
    let ret = "";
    for(var i=0; i<2; i++){
      let date    = new Date(
                      forcast.date.substr(0,4),
                      (forcast.date.substr(4,2)-1),
                      forcast.date.substr(6,2)
                    );
      date.setDate(date.getDate()-i);
      strDate = date.getFullYear()
              + ('0' + (date.getMonth() + 1)).slice(-2)
              + ('0' + date.getDate()).slice(-2);
      strExp  = '//regular:link[contains(@href,"'
              + strDate
              + '") and contains(@href,"_VPFD5") and contains(@href,"'
              + forcast.prefecture
              + '")]';
      elms    = evaluateXPath('regular', jmaRegularXML, strExp);
      if(elms.length>0){
        ret = elms[0].getAttribute('href');
        break;
      }
    }
    return ret;
    // }}}
  }

  function setOverall() {
    // {{{
    let strExp  = '//overall:Text[@type="本文"]/text()';
    let elms    = evaluateXPath('overall', jmaOverallXML, strExp);
    if(elms.length){
      forcast.overall = elms[0].nodeValue;
    }
    // }}}
  }

  function setTargetDate(){
    // {{{
    let strExp    = '//overallhead:TargetDateTime/text()';
    let elms      = evaluateXPath('overallhead', jmaOverallXML, strExp);
    forcast.date = elms[0].nodeValue.replace(/-/g,"").substr(0,8);
    // }}}
  }

  function getItemMax(pXml){
    // {{{
    let strExp  = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                + '/bdd:TimeSeriesInfo[1]'
                + '//bdd:Item';
    let items   = evaluateXPath('bdd', pXml, strExp);
    return items.length;
    // }}}
  }

  function getItemIndex(pXml){
    // {{{
    let strExp, items;
    let ret = 0;
    let max = getItemMax(pXml);
    for(var i=0; i<max; i++){
      strExp  = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
              + '/bdd:TimeSeriesInfo[1]'
              + '//bdd:Item['
              + (i+1)
              + ']/bdd:Area/bdd:Name/text()';
      items   = evaluateXPath('bdd', pXml, strExp);
      if(items[0].nodeValue==forcast.region){
        ret = i+1;
        break;
      }
    }
    return ret;
    // }}}
  }

  function getUrlWeekly(){
    // {{{
    let strDate, strExp;
    let ret = "";
    let date  = new Date(
      forcast.date.substr(0,4),
      forcast.date.substr(4,2)-1,
      forcast.date.substr(6,2)
    );
    for(var i=0;i<2;i++){
      date.setDate(date.getDate()-i);
      strDate = date.getFullYear()
              + ('0' + (date.getMonth() + 1)).slice(-2)
              + ('0' + date.getDate()).slice(-2);
      strExp  = '//regular:link[contains(@href,"'
              + strDate
              + '") and contains(@href,"_VPFW5") and contains(@href,"'
              + forcast.prefecture
              + '")]';
      let elms = evaluateXPath('regular', jmaRegularXML, strExp);
      if(elms.length){
        ret = elms[0].getAttribute('href');
        break;
      }
    }
    return ret;
    // }}}
  }

  function conversionToPrimarySubdivision(){
    // 年間を通してメンテナンス必須(最低でも１年は未完)
    // {{{
    //   青森県の区分の扱いどうすんねん
    //   一次細分区分のデータ分を全部入れろよ！！気象庁の糞が！！
    //   そもそもこんな変換テーブルが必要って XML がゴミ仕様だろうが
    //   ゴミみたいな XML の設計しやがって！！ 担当者は無能かっ！！
    let tbl = {
      "011000" : {"宗谷地方":1,"_年間テスト":""},
      "012000" : {"上川地方":1,"留萌地方":1,"_年間テスト":""},
      "013000" : {"網走地方":1,"北見地方":1,"紋別地方":1,"_年間テスト":""},
      "014100" : {"釧路地方":1,"根室地方":1,"十勝地方":2,"_年間テスト":"*"},
      "015000" : {"胆振地方":1,"日高地方":1,"_年間テスト":""},
      "016000" : {"石狩地方":1,"空知地方":1,"後志地方":1,"_年間テスト":""},
      "017000" : {"渡島地方":1,"檜山地方":1,"_年間テスト":""},
      "020000" : {"津軽":1,"下北":2,"三八上北":2,"_年間テスト":"*"},
      "030000" : {"内陸":1,"沿岸":2,"_年間テスト":"*"},
      "040000" : {"東部":1,"西部":2,"_年間テスト":"*"},
      "050000" : {"沿岸":1,"内陸":1,"_年間テスト":""},
      "060000" : {"村山":1,"置賜":1,"庄内":1,"最上":1,"_年間テスト":""},
      "070000" : {"中通り":1,"浜通り":1,"会津":2,"_年間テスト":"*"},
      "080000" : {"北部":1,"南部":1,"_年間テスト":""},
      "090000" : {"南部":1,"北部":1,"_年間テスト":""},
      "100000" : {"南部":1,"北部":2,"_年間テスト":"*"},
      "110000" : {"北部":1,"南部":1,"秩父地方":1,"_年間テスト":""},
      "120000" : {"北西部":1,"北東部":1,"南部":1,"_年間テスト":""},
      "130000" : {"東京地方":1,"伊豆諸島北部":2,"伊豆諸島南部":2,"小笠原諸島":3,"_年間テスト":"*"},
      "140000" : {"東部":1,"西部":1,"_年間テスト":""},
      "150000" : {"下越":1,"中越":1,"上越":1,"佐渡":1,"_年間テスト":""},
      "160000" : {"東部":1,"西部":1,"_年間テスト":""},
      "170000" : {"加賀":1,"能登":1,"_年間テスト":""},
      "180000" : {"嶺北":1,"嶺南":1,"_年間テスト":""},
      "190000" : {"中・西部":1,"東部・富士五湖":1,"_年間テスト":""},
      "200000" : {"北部":1,"中部":1,"南部":1,"_年間テスト":"*"},
      "210000" : {"美濃地方":1,"飛騨地方":1,"_年間テスト":"*"},
      "220000" : {"中部":1,"西部":1,"東部":1,"伊豆":1,"_年間テスト":""},
      "230000" : {"西部":1,"東部":1,"_年間テスト":""},
      "240000" : {"北中部":1,"南部":1,"_年間テスト":""},
      "250000" : {"南部":1,"北部":2,"_年間テスト":"*"},
      "260000" : {"南部":1,"北部":2,"_年間テスト":"*"},
      "270000" : {"大阪府":1,"_年間テスト":""},
      "280000" : {"南部":1,"北部":2,"_年間テスト":"*"},
      "290000" : {"北部":1,"南部":2,"_年間テスト":"*"},
      "300000" : {"北部":1,"南部":2,"_年間テスト":"*"},
      "310000" : {"東部":1,"中・西部":1,"_年間テスト":""},
      "320000" : {"東部":1,"西部":1,"隠岐":1,"_年間テスト":""},
      "330000" : {"南部":1,"北部":1,"_年間テスト":"*"},
      "340000" : {"南部":1,"北部":1,"_年間テスト":"*"},
      "350000" : {"西部":1,"中部":1,"東部":1,"北部":1,"_年間テスト":""},
      "360000" : {"北部":1,"南部":1,"_年間テスト":""},
      "370000" : {"香川県":1,"_年間テスト":""},
      "380000" : {"中予":1,"東予":1,"南予":1,"_年間テスト":""},
      "390000" : {"中部":1,"東部":1,"西部":1,"_年間テスト":""},
      "400000" : {"福岡地方":1,"北九州地方":1,"筑豊地方":1,"筑後地方":1,"_年間テスト":""},
      "410000" : {"南部":1,"北部":1,"_年間テスト":""},
      "420000" : {"南部":1,"北部":1,"壱岐・対馬":1,"五島":1,"_年間テスト":"*"},
      "430000" : {"熊本地方":1,"阿蘇地方":1,"天草・芦北地方":1,"球磨地方":1,"_年間テスト":""},
      "440000" : {"中部":1,"北部":1,"西部":1,"南部":1,"_年間テスト":""},
      "450000" : {"南部平野部":1,"北部平野部":1,"南部山沿い":1,"北部山沿い":1,"_年間テスト":""},
      "460100" : {"薩摩地方":1,"大隅地方":1,"種子島・屋久島地方":1,"奄美地方":2,"_年間テスト":""},
      "471000" : {"本島中南部":1,"本島北部":1,"久米島":1,"_年間テスト":""},
      "472000" : {"大東島地方":1,"_年間テスト":""},
      "473000" : {"宮古島地方":1,"_年間テスト":""},
      "474000" : {"石垣島地方":1,"与那国島地方":1,"_年間テスト":""}
    };
    return tbl[forcast.prefecture][forcast.region];
    // }}}
  }

  function setStep2DayTemps(pXml){
    // {{{
    let date, time, strDuration,strType, strTemp,noTemp;
    let strExp    = '//bdd:MeteorologicalInfos[@type="地点予報"][1]'
                  + '/bdd:TimeSeriesInfo[1]'
                  + '//bdd:TimeDefine';
    let items     = evaluateXPath('bdd', pXml, strExp);
    let cntAll    = items.length;
    let itemIndex = conversionToPrimarySubdivision();
    for(var i=0;i<2;i++){
      forcast.days[i].temps = new Array();
    }
    for(var i=0;i<cntAll;i++){
      // 日中最高気温・朝の最低気温以外をスキップするためのチェック
      strExp      = '//bdd:MeteorologicalInfos[@type="地点予報"][1]'
                  + '/bdd:TimeSeriesInfo[1]'
                  + '//bdd:TimeDefine[@timeId="'+(i+1)+'"]/bdd:Duration/text()';
      items       = evaluateXPath('bdd', pXml, strExp);
      strDuration = items[0].nodeValue;
      if(strDuration != "PT9H") continue;

      // 日付
      strExp  = '//bdd:MeteorologicalInfos[@type="地点予報"][1]'
              + '/bdd:TimeSeriesInfo[1]'
              + '//bdd:TimeDefine[@timeId="'+(i+1)+'"]/bdd:DateTime/text()';
      items   = evaluateXPath('bdd', pXml, strExp);
      date    = items[0].nodeValue.replace(/-/g,"").substr(0,8);
      // タイプ
      strExp  = '//bdd:MeteorologicalInfos[@type="地点予報"][1]'
              + '/bdd:TimeSeriesInfo[1]'
              + '/bdd:Item['
              + itemIndex
              + ']'
              + '//jmx_eb:Temperature[@refID="'+(i+1)+'"]/@type';
      items   = evaluateXPath('bdd', pXml, strExp);
      strType = items[0].nodeValue;
      // 温度
      strExp  = '//bdd:MeteorologicalInfos[@type="地点予報"][1]'
              + '/bdd:TimeSeriesInfo[1]'
              + '/bdd:Item['
              + itemIndex
              + ']'
              + '//jmx_eb:Temperature[@refID="'+(i+1)+'"]/text()';
      items   = evaluateXPath('bdd', pXml, strExp);
      strTemp = items[0].nodeValue;

      // json への push
      if(forcast.date==date){// 今日
        if(strType=="朝の最低気温"){
          forcast.days[0].temps.push(strTemp);
        }else{
          noTemp = forcast.days[0].temps.length
          if(noTemp<1){
            forcast.days[0].temps.push("");
          }
          forcast.days[0].temps.push(strTemp);
        }
      }else{                    // 明日
        if(strType=="朝の最低気温"){
          noTemp = 2 - forcast.days[0].temps.length;
          for(var j=0;j<noTemp;j++){
            forcast.days[0].temps.push("");
          }
          forcast.days[1].temps.push(strTemp);
        }else{
          forcast.days[1].temps.push(strTemp);
        }
      }
    }
    // }}}
  }

  function setStep2DayProbs(pXml){
    // {{{
    let strExp    = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                  + '/bdd:TimeSeriesInfo[2]'
                  + '//bdd:TimeDefine';
    let items     = evaluateXPath('bdd', pXml, strExp);
    let cntAll    = items.length;
    let itemIndex = getItemIndex(pXml);
    let getPnt    = 1;
    for(var i=0;i<2;i++){
      forcast.days[i].probs = new Array();
      let cntSkip = (i==0)?(8-cntAll):0;
      for (var j=0; j<cntSkip; j++){
        forcast.days[i].probs.push("--");
      }
      let max   = 4 - cntSkip;
      for (var j=0; j<max;j++){
        strExp  = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                + '/bdd:TimeSeriesInfo[2]'
                + '/bdd:Item['
                + itemIndex
                + ']'
                + '//jmx_eb:ProbabilityOfPrecipitation[@refID="'
                + getPnt
                + '"]/text()';
        items   = evaluateXPath('bdd', pXml, strExp);
        forcast.days[i].probs.push(items[0].nodeValue);
        getPnt++;
      }
    }
    // }}}
  }

  function setStep2DayWeater(pXml){
    // {{{
    let strExp,items;
    let itemIndex = getItemIndex(pXml);
    // 天気予報設定
    for (var i=0; i<2; i++) {
      // 日付設定
      strExp    = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                + '/bdd:TimeSeriesInfo[1]'
                + '//bdd:TimeDefine[@timeId="'+ (i+1) +'"]'
                + '/bdd:DateTime/text()';
      items     = evaluateXPath('bdd', pXml, strExp);
      day.date  = items[0].nodeValue.substr(5,5).replace(/-/,"/");
      var d     = new Date(items[0].nodeValue);
      day.dow   = d.getDay();

      //  天気設定
      strExp    = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                + '/bdd:TimeSeriesInfo[1]'
                + '//bdd:TimeDefine[@timeId="'+ (i+1) +'"]'
                + '/../../bdd:Item['
                + itemIndex
                + ']//jmx_eb:Weather[@refID="'+(i+1)+'"]'
                + '/text()';
      items     = evaluateXPath('bdd', pXml, strExp);
      day.weather = items[0].nodeValue;

      //  天気コード設定
      strExp    = '//bdd:MeteorologicalInfos[@type="区域予報"][1]'
                + '/bdd:TimeSeriesInfo[1]'
                + '//bdd:TimeDefine[@timeId="'+ (i+1) +'"]'
                + '/../../bdd:Item['
                + itemIndex
                + ']//jmx_eb:WeatherCode[@refID="'+(i+1)+'"]'
                + '/text()';
      items     = evaluateXPath('bdd', pXml, strExp);
      day.wcode = items[0].nodeValue;

      forcast.days.push({...day});
    }
    return ;
    // }}}
  }

  function set2DayWeather(pXml){
    // {{{
    setStep2DayWeater(pXml);
    setStep2DayProbs(pXml);
    setStep2DayTemps(pXml);
    // }}}
  }

  function getWDate(pDay){
    // {{{
    let doc     = jmaWeeklyXML.responseXML;
    let strExp  = '//bdw:MeteorologicalInfos[@type="区域予報"]'
                + '//bdw:TimeDefine[@timeId="'
                + (pDay+1)
                + '"]/bdw:DateTime/text()';
    let items   = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    return items[0].nodeValue.replace(/-/g,"").substr(0,8);
    // }}}
  }

  function getSkipDayNo(){
    // {{{
    let date  = new Date(
                  forcast.date.substr(0,4),
                  forcast.date.substr(4,2)-1,
                  forcast.date.substr(6,2)
                );
    date.setDate(date.getDate()+2);
    let strDate = date.getFullYear()
                + ('0' + (date.getMonth() + 1)).slice(-2)
                + ('0' + date.getDate()).slice(-2);
    let max = getDayNo();
    for(var i=0; i<max; i++){
      let dateXML = getWDate(i);
      if(strDate==dateXML) break;
    }
    return i;
    // }}}
  }

  function getDayNo(){
    // {{{
    strExp  = '//bdw:MeteorologicalInfos[@type="区域予報"]'
                + '//bdw:Item[1]'
                + '//bdw:WeatherPart'
                + '/jmx_eb:Weather';
    items   = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    if(items.length) return items.length;
    return 0;
    // }}}
  }

  function setWeeklyProbs(pDay){
    // {{{
    let doc       = jmaWeeklyXML.responseXML;
    let itemIndex = getWItemIndex();

    forcast.days[pDay+2].probs  = new Array();

    // 降水確率
    strExp      = '//bdw:MeteorologicalInfos[@type="区域予報"]'
                + '//bdw:Item['
                + itemIndex
                + ']'
                + '//jmx_eb:ProbabilityOfPrecipitation[@type="日降水確率" and @refID="'
                + (getSkipDayNo()+pDay+1)
                + '"]/text()';
    elms        = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    forcast.days[pDay+2].probs.push(elms[0].nodeValue);
    // }}}
  }

  function setWeeklyTemps(pDay){
    // {{{
    let doc       = jmaWeeklyXML.responseXML;
    let itemIndex = getWItemIndex();

    forcast.days[pDay+2].temps = new Array();
    let skipNo  = getSkipDayNo();

    // 最低気温
    strExp      = '//bdw:MeteorologicalInfos[@type="地点予報"]'
                + '//bdw:Item['
                + itemIndex
                + ']'
                + '//jmx_eb:Temperature[@type="最低気温" and @refID="'
                + (skipNo+pDay+1)
                + '"]/text()';
    elms        = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    forcast.days[pDay+2].temps.push(elms[0].nodeValue);

    // 最高気温
    strExp      = '//bdw:MeteorologicalInfos[@type="地点予報"]'
                + '//bdw:Item['
                + itemIndex
                + ']'
                + '//jmx_eb:Temperature[@type="最高気温" and @refID="'
                + (skipNo+pDay+1)
                + '"]/text()';
    elms        = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    forcast.days[pDay+2].temps.push(elms[0].nodeValue);
    // }}}
  }

  function getWItemMax(){
    // {{{
    let strExp  = '//bdw:MeteorologicalInfos[@type="区域予報"]'
                + '/bdw:TimeSeriesInfo'
                + '//bdw:Item';
    let items   = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    return items.length;
    // }}}
  }

  function getWItemIndex(){
    // {{{
    let strExp, items;
    let ret = 0;
    let doc = jmaWeeklyXML.responseXML;
    let max = getWItemMax();
    let i;
    for(i=0; i<max; i++){
      strExp  = '//bdw:MeteorologicalInfos[@type="区域予報"]'
              + '/bdw:TimeSeriesInfo[1]'
              + '//bdw:Item['
              + (i+1)
              + ']/bdw:Area/bdw:Name/text()';
      items   = evaluateXPath('bdd', jmaWeeklyXML, strExp);
      if(items[0].nodeValue==forcast.region){
        ret = i+1;
        break;
      }
    }
    if(i==max) ret=1; // 一次細分区分ではなく都道府県指定の場合

    return ret;
    // }}}
  }

  function setDWeeklyWeather(pDay){
    // {{{
    let dateXML,strExp,elms;
    let skipNo    = getSkipDayNo();
    let itemIndex = getWItemIndex();

    // 日付
    strExp    = '//bdw:MeteorologicalInfos[@type="区域予報"]'
              + '//bdw:TimeDefine[@timeId="'
              + (pDay+skipNo+1)
              + '"]'
              + '/bdw:DateTime/text()'
    elms      = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    day.date  = elms[0].nodeValue.substr(5,5).replace(/-/,"/");
    var d     = new Date(elms[0].nodeValue);
    day.dow   = d.getDay();

    // 天気文字列
    strExp      = '//bdw:MeteorologicalInfos[@type="区域予報"]'
                + '//bdw:Item['
                + itemIndex
                + ']'
                + '//bdw:WeatherPart'
                + '/jmx_eb:Weather[@refID="'
                + (pDay+skipNo+1)
                + '"]/text()';
    elms        = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    day.weather = elms[0].nodeValue;

    // 天気コード
    strExp    = '//bdw:MeteorologicalInfos[@type="区域予報"]'
              + '//bdw:Item['
              + itemIndex
              + ']'
              + '//bdw:WeatherCodePart'
              + '/jmx_eb:WeatherCode[@refID="'
              + (pDay+skipNo+1)
              + '"]/text()';
    elms      = evaluateXPath('bdw', jmaWeeklyXML, strExp);
    day.wcode = elms[0].nodeValue;

    forcast.days.push({...day});
    // }}}
  }

  function setWeeklyWeather(){
    // {{{
    let max = getDayNo()-getSkipDayNo();
    for(var i=0;i<max;i++){
      setDWeeklyWeather(i);
      setWeeklyTemps(i);
      setWeeklyProbs(i);
    }
    // }}}
  }

  function getWeeklyXML(pUrl){
    // {{{
    fetch(pUrl)
      .then(response => response.text())
      .then((data) => {
        let domparser = new DOMParser();
        jmaWeeklyXML  = domparser.parseFromString(data, "application/xml");
        setWeeklyWeather();
        hutteNippon.weatherData = forcast;
        clearContentsWeather();
        dispContentsWeather();
//        sendJSON();
      });
    // }}}
  }

  function getUrlJmaRegularL(){
    // {{{
    fetch(urlJmaRegularL)
      .then(response => response.text())
      .then((data) => {
        let domparser = new DOMParser();
        jmaRegularXML = domparser.parseFromString(data, "application/xml");
        let urlJmaWeekly = getUrlWeekly();  // store URL of weekly weather forcast
        if(urlJmaWeekly.length){
          getWeeklyXML(urlJmaWeekly);
        }else{
          console.log('府県週間予報 XML の URL が見つからない');
        }
      });
    // }}}
  }

  function getDailyXML(pUrl){
    // {{{
    fetch(pUrl)
      .then(response => response.text())
      .then((data) => {
        let domparser   = new DOMParser();
        let jmaDailyXML = domparser.parseFromString(data, "application/xml");
        set2DayWeather(jmaDailyXML);
        let urlJmaWeekly = getUrlWeekly();  // store URL of weekly weather forcast
        if(urlJmaWeekly.length){
          getWeeklyXML(urlJmaWeekly);
        }else{
          getUrlJmaRegularL();
        }
      });
    // }}}
  }

  function getOverallXML(pUrl){
    // {{{
    fetch(pUrl)
      .then(response => response.text())
      .then((data) => {
        let domparser = new DOMParser();
        jmaOverallXML = domparser.parseFromString(data, "application/xml");
        setTargetDate();
        setOverall();
        urlJmaDaily = getUrlDaily();  // store URL of daily weather forcast
        getDailyXML(urlJmaDaily);
      });
    // }}}
  }

  function getUrlOverall(pPref){
    // {{{
    let strDate,strExp;
    let ret = "";
    let date= new Date();
    for(var i=0;i<2;i++){
      date.setDate(date.getDate()-i);
      strDate = date.getFullYear()
              + ('0' + (date.getMonth() + 1)).slice(-2)
              + ('0' + date.getDate()).slice(-2);
      strExp  = '//regular:link[contains(@href,"'
              + strDate
              + '") and contains(@href,"_VPFG5") and contains(@href,"'
              + pPref
              + '")]';
      let elms = evaluateXPath('regular', jmaRegularXML, strExp);
      if(elms.length) {
        ret = elms[0].getAttribute('href');
        break;
      }
    }
    return ret;
    // }}}
  }

  function getUrlJmaRegular(pPref){
    // Regular XML を fetch し天気概要を取得
    // {{{
    fetch(urlJmaRegular)
      .then(response => response.text())
      .then((data) => {
        let domparser = new DOMParser();
        jmaRegularXML = domparser.parseFromString(data, "application/xml");
        urlJmaOverall = getUrlOverall(pPref);  // store URL of Jma Overall
        if(urlJmaOverall.length>0) {
          getOverallXML(urlJmaOverall);
        } else {
          console.log('府県天気概況未発表');
        }
      });
    // }}}
  }

  function getWeatherData(pPref){
    // {{{
    getUrlJmaRegular(pPref);
    // }}}
  }

  function closeWin(){
    // {{{
    window.close();
    // }}}
  }

  function openOverall(){
    // {{{
    var urlAverall = browser.runtime.getURL("popup/overall.html");
    browser.windows.create({
      url:    urlAverall,
      type:   "popup",
      height: 322,
      width:  448
    });
    // }}}
  }

  function openMap(){
    // {{{
    var urlMap = browser.runtime.getURL("popup/map.html");
    var creating = browser.windows.create({
      url:    urlMap,
      type:   "popup",
      width:  504,
      height: 544
    },(win)=>{
    });
    // }}}
  }

  function openNowcast(){
    // {{{
    var urlNowcast  = browser.runtime.getURL("popup/nowcast.html");
    browser.windows.create({
      url:    urlNowcast,
      type:   "popup",
      height: 574,
      width:  576
      /*
      height: 832,
      width:  1056
      */
    });
    // }}}
  }

  function openSatellite(){
    // {{{
    // open https://forcast.weathermap.jp/public_datas/SAT/IR-FL_P3-600m.jpg
    var urlSatellite = browser.runtime.getURL("popup/satellite.html");
    var creating = browser.windows.create({
      url:    urlSatellite,
      type:   "popup",
      height: 528,
      width:  640
    },(win)=>{
    });
    // }}}
  }

  function openHtb(){
    // {{{
    browser.tabs.create({"url":"https://www.hbc.co.jp/weather/pro-weather.html"});
    // }}}
  }

  function openJma(){
    // {{{
    browser.tabs.create({"url":"https://www.jma.go.jp/jma/index.html"});
    // }}}
  }

  browser.runtime.onMessage.addListener(
    // {{{
    function(request,sender,sendResponse){
      if(sender.url==locationURL){
        if(request.status=="set location"){
          getLocation();
        }
      } else if(sender.url==overallURL){
        if(request.request=="send overall"){
          let t = hutteNippon.weatherData.overall;
          sendResponse(t);
        }
      }
    }
    // }}}
  );

  function selectLocation(){
    // {{{
    browser.windows.create({
      url:    locationURL,
      type:   "popup",
      width:  384,
      height: 132
    });
    // }}}
  }

  function getLocation() {
    // {{{
    let location;
    browser.storage.local.get("location")
      .then((results)=>{
        if(results["location"]!=undefined){
          day.temps.length    = 0;
          day.probs.length    = 0;
          forcast.days.length = 0;
          hutteNippon.prefecture="";
          hutteNippon.weatherData = {};
          hutteNippon.weatherData.days !== undefined ? hutteNippon.weatherData.days.length = 0 : true;
          location=results["location"];
          forcast.prefecture     = location["prefecture"];
          forcast.region         = location["region"];
          hutteNippon.prefecture  = pref[location["prefecture"]];
          hutteNippon.region      = location["region"];
          dispLocationButtonLavel();
          getWeatherData(location["prefecture"], location["region"]);
        }else{
          selectLocation();
        }
      });
    // }}}
  }

  function init() {
    // {{{
    document.getElementById('close_button').addEventListener('click',closeWin);
    document.getElementById('locationButton').addEventListener('click',selectLocation);
    document.getElementById('overall_button').addEventListener("click",openOverall);
    document.getElementById('map_button').addEventListener("click",openMap);
    document.getElementById('satellite_button').addEventListener("click",openSatellite);
    document.getElementById('jma_button').addEventListener("click",openJma);
    document.getElementById('htb_button').addEventListener("click",openHtb);
    getLocation()
    // }}}
  }
  window.addEventListener('DOMContentLoaded',init);
})();
