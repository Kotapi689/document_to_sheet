function autoFill() {
  /*---------------------------
  | 最初に1度だけ行う設定          |
  -------------------------- */
  var rowFrom = 15;             //最初のセリフの行を指定 ""はつけない
  var lineFrom = "C";           //セリフの列を指定
  var actorLineFrom = "B";      //話者の列を指定
  var countLineFrom = "D";      //文字数カウントの列を指定
  var kw1 = "ゆっくりしていってね"; //導入終わりの霊夢&魔理沙を判別するキーワード
  var kw2 = "視聴ありがとう";     //霊夢&魔理沙を判別するキーワード
  var kw3 = "じゃあね";         //霊夢&魔理沙を判別するキーワード


  // 書き込むためにシートを呼び出す
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var spreadsheetTab = spreadsheet.getActiveSheet();
  var ui = SpreadsheetApp.getUi(); //Uiクラスを使用可能にする

  // 必要事項の確認ダイアログを出す
  var docIdResponse = ui.prompt("取り込むドキュメントのID", "【URLを確認】https://docs.google.com/document/d/xxxx/edit のxxxx部分", ui.ButtonSet.OK_CANCEL);
  var docId = docIdResponse.getResponseText();
  var firstActorResponse = ui.prompt("最初の話者", "霊夢=0 / 魔理沙=1", ui.ButtonSet.OK_CANCEL);
  var firstActor = Number(firstActorResponse.getResponseText());

  // ドキュメントを読み込んで段落ごとに配列に入れる
  const body = DocumentApp.openById(docId).getBody();
  const arrs = new Array();
  for(var txt of body.getParagraphs()) {
    arrs.push(txt.getText());
  }

  arrsLength = arrs.length; //配列の要素数を数えておく

  // 霊夢 / 魔理沙 / 霊夢&魔理沙 を振り分けるフラグを作る
  flag = firstActor; //0:霊夢 1:魔理沙 2:霊夢&魔理沙

  // 最後に空行削除するためにrowFromをバックアップ
  targetRowFrom = String(rowFrom);

  // 一行ずつ書き込み
  arrs.forEach(function(arr) {
    const insertRange = spreadsheetTab.getRange(lineFrom + rowFrom.toString()); //セリフ書き込みスタート地点を指定
    const actorRange = spreadsheetTab.getRange(actorLineFrom + rowFrom.toString()); //話者書き込みスタート地点を指定
    const tFlag1 = arr.match(kw1);
    const tFlag2 = arr.match(kw2);
    const tFlag3 = arr.match(kw3);

    if(tFlag1 != null || tFlag2 != null || tFlag3 != null) {
      flag = 2;
    }
    if(flag == 0 && arr != "") {
      insertRange.setValue(arr);
      actorRange.setValue("霊夢FX");
    } else if(flag == 1 && arr != "") {
      insertRange.setValue(arr);
      actorRange.setValue("魔理沙FX");
    } else if(flag == 2 && arr != "") {
      Utilities.sleep(50);
      insertRange.setValue(arr);
      actorRange.setValue("霊夢&魔理沙FX");
      if(tFlag1 != null || tFlag2 != null || tFlag3 != null) {
        kwFilter = arr; //次の順目で正しいキーワードでアラートを出すためにフィルター設置
      }
    } else if (arr == "") {
      if(flag == 0) {
        flag = 1;
      } else if (flag == 1) {
        flag = 0;
      } else if (flag == 2) {
        if(kwFilter != null && kwFilter != kw3) {
          var response = ui.alert('「' + kwFilter + '」の次は霊夢ですか？', ui.ButtonSet.YES_NO);
          if (response === ui.Button.YES) {
            flag = 0; //次が霊夢ならフラグ0に
          } else {
            flag = 1; //次が魔理沙ならフラグ1に
          }
        }
      }
    }

    rowFrom++;
  })

  /* ここからは空白行を削除する処理 */
  const targetRange = spreadsheetTab.getRange(lineFrom + targetRowFrom + ":" + lineFrom ); //セリフの頭から下までを削除の対象にする
  const targetArray = targetRange.getValues(); //セルの値を取得
  const targetArrayFlats = targetArray.flat(); // 二次元配列を一次元に
  const targetArrayFlatsLength = targetArrayFlats.length; //要素数を取得

  targetRow = 0;
  targetArrayFlats.forEach(function(targetArrayFlat) {
    if(targetArrayFlat == "") { //空行なら削除してtargetRowそのまま
      spreadsheetTab.deleteRow(Number(targetRowFrom) + targetRow);
    } else { //データが入っていれば次の行を調べるためtargetRowに1を足す
      targetRow++;
    }
  })

  /* 仕上げに文字数カウントが抜けている箇所を埋める */
  const countRange = spreadsheetTab.getRange(countLineFrom + targetRowFrom + ":" + countLineFrom); //カウントの頭から下までが対象
  const countArray = countRange.getValues();
  const countArrayFlats = countArray.flat();
  const countArrayFlatsLength = countArrayFlats.length;

  countRow = 0;
  countArrayFlats.forEach(function(countArrayFlat) {
    if(countArrayFlat == "") {
      insertCountRange = spreadsheetTab.getRange(countLineFrom + String(Number(targetRowFrom) + countRow));
      insertCountRange.setValue("=len(" + lineFrom + String(Number(targetRowFrom) + countRow) + ")");
    }
    countRow++;
  })

  // すべて完了したらアラートでおしらせ
  ui.alert("完了しました！");
}