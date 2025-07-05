'use strict';

const fileInput = document.getElementById('fileInput');
const jsInput = document.getElementById('jsInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');

const binalizationThreshold = 192;

let imageElement = null;
let asciiArt = '';

function generateAsciiArtToFitLength(img, requiredLength) {
  const maxScale = 10;
  let scale = Math.sqrt(requiredLength / (img.width * img.height));
  scale = Math.floor(scale * 100) / 100;
  let width, height, ascii, count;

  do {
    width = Math.floor(img.width * scale);
    height = Math.floor(img.height * scale * 0.5);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    ascii = '';
    count = 0;

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

    if (count >= requiredLength) {
      console.log(`scale: ${scale}, required: ${requiredLength}, len: ${count}`);
      break;
    }
    scale += 0.01;
  } while (scale <= maxScale);

  return ascii;
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
    let jsfucked = JScrewIt.encode(userCode, { features: "COMPACT" /*BROWSER*/ });
    const requiredLength = jsfucked.length;
    asciiArt = generateAsciiArtToFitLength(imageElement, requiredLength);

    // @の数を数える
    const atCount = (asciiArt.match(/@/g) || []).length;
    if (atCount > jsfucked.length) {
      const diff = atCount - jsfucked.length;
      jsfucked += '//'.repeat(diff);
    }

    let result = '';
    let jsIndex = 0;

    for (let i = 0; i < asciiArt.length; i++) {
      const ch = asciiArt[i];
      if (ch === '@' && jsIndex < jsfucked.length) {
        result += jsfucked[jsIndex++];
      } else {
        result += ch;
      }
    }

    // 実行可能なコードに修正
    let lines = result.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let pos = lines[i].indexOf('/');
      if (pos === -1) continue;
      if (lines[i][pos + 1] !== '/') {
        lines[i] = lines[i].substring(0, pos) + '//' + lines[i].substring(pos + 2);
      }
    }
    result = lines.join('\n');

    output.textContent = result;
  } catch (e) {
    alert('JavaScriptコードの変換に失敗しました: ' + e.message);
  }
});
