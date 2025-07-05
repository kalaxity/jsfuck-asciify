'use strict';

const binalizationThreshold = 192;

const fileInput = document.getElementById('fileInput');
const jsInput = document.getElementById('jsInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');
let imageElement = null;

function generateAsciiArtToFitLength(img, requiredLength) {
  const maxScale = 10;
  let scale = Math.sqrt(requiredLength / (img.width * img.height));
  scale = Math.floor(scale * 100) / 100;
  let ascii;

  do {
    const width = Math.floor(img.width * scale);
    const height = Math.floor(img.height * scale * 0.5);

    // 画像をwidth * heightにリサイズ
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 画像をAAに変換
    ascii = '';
    let count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const brightness = (r + g + b) / 3;
        if (brightness < binalizationThreshold) {
          ascii += '@';
          count++;
        } else {
          ascii += ' ';
        }
      }
      ascii += '\n';
    }

    // AAの文字数が規定に達したか確認
    if (count >= requiredLength) {
      console.log(`scale: ${scale}, required: ${requiredLength}, len: ${count}`);
      break;
    }
    scale += 0.01;
  } while (scale <= maxScale);

  return ascii;
}

function embedJSFuckInAsciiArt(asciiArt, jsfucked) {
  // AAの文字数を数える
  const atCount = (asciiArt.match(/@/g) || []).length;
  if (atCount > jsfucked.length) {
    const diff = atCount - jsfucked.length;
    jsfucked += '//'.repeat(diff);
  }

  // JSFuckコードをASCIIアートに埋め込む
  let jsfuckedAA = '';
  let jsIndex = 0;
  for (const ch of asciiArt) {
    if (ch === '@' && jsIndex < jsfucked.length) {
      jsfuckedAA += jsfucked[jsIndex++];
    } else {
      jsfuckedAA += ch;
    }
  }

  // 実行可能なコードに修正（/が単独で出現しないようにする）
  let lines = jsfuckedAA.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const pos = lines[i].indexOf('/');
    if (pos === -1) continue;
    if (lines[i][pos + 1] !== '/') {
      lines[i] = lines[i].substring(0, pos) + '//' + lines[i].substring(pos + 2);
    }
  }
  
  return lines.join('\n');
}

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
    const jsfucked = JScrewIt.encode(userCode, { features: "COMPACT" /*BROWSER*/ });

    // 2. AAを作成
    const requiredLength = jsfucked.length;
    const asciiArt = generateAsciiArtToFitLength(imageElement, requiredLength);

    // 3. JSFuckコードをAAに埋め込む
    const jsfuckedAA = embedJSFuckInAsciiArt(asciiArt, jsfucked);
    output.textContent = jsfuckedAA;
  } catch (e) {
    alert('JavaScriptコードの変換に失敗しました: ' + e.message);
  }
});
