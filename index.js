'use strict';

// TODO: 定数を適切な値に調整
const BINALIZATION_THRESHOLD = 192;
const MAX_SCALE = 10; // AAの最大拡大率 
const SCALE_STEP = 0.01; // AAの拡大率のステップ

// DOM要素の取得 
// TODO: コードの整理
const fileInput = document.getElementById('fileInput');
const jsInput = document.getElementById('jsInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');
let imageElement = null;

/**
 * 画像からアスキーアートを生成する関数
 * @param  {HTMLImageElement} img 画像  
 * @param  {float} scale 画像の拡大率
 * @return {string} 作成したアスキーアート
 */
const generateAsciiArt = (img, scale) => {
  // 画像の縦横サイズを拡大
  const width = Math.floor(img.width * scale);
  const height = Math.floor(img.height * scale * 0.5);

  // 画像を実際にリサイズ
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 画像をAAに変換
  let asciiArt = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const brightness = (r + g + b) / 3;
      asciiArt += (brightness < BINALIZATION_THRESHOLD) ? '@' : ' ';
    }
    asciiArt += '\n';
  }

  return asciiArt;
}

/**
 * 最小文字数を満たすアスキーアートを生成する関数
 * @param  {HTMLImageElement} img 画像 
 * @param  {int} requiredLength 必要な最小文字数
 * @return {string} 最小文字数を満たすアスキーアート 
 */
const generateAsciiArtToFitLength = (img, requiredLength) => {
  let scale = Math.sqrt(requiredLength / (img.width * img.height));
  scale = Math.floor(scale * 100) / 100; // TODO: ここのマジックナンバーがMAX_SCALEに依存するようにコードを書き換える

  do {
    // AAを生成
    const asciiArt = generateAsciiArt(img, scale);

    // AAの文字数が規定に達したか確認
    const count = (asciiArt.match(/@/g) || []).length;
    if (count >= requiredLength) {
      console.log(`scale: ${scale}, required: ${requiredLength}, len: ${count}`);
      return asciiArt;
    }
    scale += SCALE_STEP;
  } while (scale <= MAX_SCALE);

  throw new Error(`JSFuckコードの長さ(${requiredLength})に合うAAを生成できませんでした。`);
}

/**
 * JSFuckコードをアスキーアートに埋め込む関数
 * @param  {string} asciiArt アスキーアート
 * @param  {string} jsfucked JSFuckコード
 * @return {string} 埋め込みが完了したアスキーアート
 */
const embedJSFuckInAsciiArt = (asciiArt, jsfucked) => {
  // JSFuckコードをAAに埋め込む
  let jsfuckedAA = '';
  let jsIndex = 0;
  for (const ch of asciiArt) {
    if (ch === '@' && jsIndex < jsfucked.length) {
      jsfuckedAA += jsfucked[jsIndex];
      jsIndex++;
    } else {
      jsfuckedAA += ch;
    }
  }

  // 実行可能なコードに修正（/が単独で出現しないようにする）
  let lines = jsfuckedAA.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const pos = lines[i].indexOf('/');
    if (pos !== -1 && lines[i][pos + 1] !== '/') {
      lines[i] = lines[i].substring(0, pos) + '//' + lines[i].substring(pos + 2);
    }
  }
  
  return lines.join('\n');
}

/**
 * 画像ファイルが選択されたときの処理
 */
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    img.src = event.target.result;
  };

  img.onload = () => {
    imageElement = img;
    output.textContent = '画像が読み込まれました。JavaScriptコードを入力し、「生成」ボタンを押してください。';
  };

  reader.readAsDataURL(file);
});

/**
 * 「生成」ボタンがクリックされたときの処理
 */
generateBtn.addEventListener('click', () => {
  if (!imageElement) {
    alert('先に画像をアップロードしてください');
    return;
  }
  const userCode = jsInput.value.trim();
  if (!userCode) {
    alert('JavaScriptコードを入力してください');
    return;
  }

  try {
    // 1. JSFuckコードを生成
    let jsfucked = JScrewIt.encode(userCode, { features: "COMPACT" /*BROWSER*/ });

    // 2. AAを作成
    const requiredLength = jsfucked.length;
    const asciiArt = generateAsciiArtToFitLength(imageElement, requiredLength);

    // AAの文字数をJSFuckコードと揃える
    const atCount = (asciiArt.match(/@/g) || []).length;
    if (atCount > jsfucked.length) {
      const diff = atCount - jsfucked.length;
      jsfucked += '//'.repeat(diff);
    }

    // 3. JSFuckコードをAAに埋め込む
    const jsfuckedAA = embedJSFuckInAsciiArt(asciiArt, jsfucked);
    output.textContent = jsfuckedAA;
  } catch (e) {
    alert('JavaScriptコードの変換に失敗しました: ' + e.message);
  }
});
