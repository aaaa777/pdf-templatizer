import { jsPDF } from 'jspdf';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import * as PCE from '../static/js/pdf-canvas-editor';
// import '../static/css/base.css';
// import './index.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/pdf.worker.mjs';

const CMAP_URL = 'assets/cmaps/';
const CMAP_PACKED = true;
const FABRIC_DPI = 96; // Fabric.js の DPI
const PDF_DPI = 72; // jsPDF の DPI

let pdfDoc = null;
let fabricCanvas;
let pdfCanvas;
let canvasScale = 1;
let currentPage = 1; // 現在のページ番号を追跡
let totalPages = 1;  // PDFの総ページ数

document.addEventListener('DOMContentLoaded', function() {
    fabricCanvas = new fabric.Canvas('fabric-canvas');
    const pdfUpload = document.getElementById('pdf-upload');

    // pdf-canvasを動的に作成
    pdfCanvas = document.createElement('canvas');
    pdfCanvas.id = 'pdf-canvas';
    document.getElementsByClassName('canvas-container')[0].prepend(pdfCanvas);

    pdfUpload.addEventListener('change', handleFileUpload);

    const saveButton = document.getElementById('pdf-save');
    saveButton.textContent = 'PDF保存';
    saveButton.onclick = onPressSavePDF;
    // document.body.appendChild(saveButton);

    const addTextButton = document.getElementById('pdf-add-text');
    addTextButton.textContent = 'テキスト追加';
    addTextButton.onclick = addText;
    // document.body.appendChild(addTextButton);
});

// handleFileUpload関数の修正
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
        console.error('アップロードされたファイルはPDFではありません。');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED
        }).promise.then(function(pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages; // 総ページ数を保存
            currentPage = 1; // 最初のページを表示
            renderPage(currentPage);
        });
    };
    fileReader.readAsArrayBuffer(file);
}


// renderPage関数の修正
function renderPage(num) {
    if (num < 1 || num > totalPages) {
        console.error('無効なページ番号です');
        return;
    }

    currentPage = num; // 現在のページ番号を更新

    pdfDoc.getPage(num).then(function(page) {
        const originalViewport = page.getViewport({ scale: 1 });
        const scaledViewport = page.getViewport({ scale: canvasScale });

        pdfCanvas.height = scaledViewport.height;
        pdfCanvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: pdfCanvas.getContext('2d'),
            viewport: scaledViewport
        };

        page.render(renderContext);

        fabricCanvas.setDimensions({
            width: scaledViewport.width,
            height: scaledViewport.height
        });

        // Fabric.jsのキャンバスのズーム処理
        fabricCanvas.setZoom(canvasScale);

        fabricCanvas.getObjects().forEach(obj => {
            obj.setCoords();
        });
    
        fabricCanvas.renderAll();
    });
}

window.addText = function() {
    const text = new fabric.IText('テキストを入力', {
        left: 100,
        top: 100,
        fontFamily: 'Noto-Sans-JP', // フォント名を簡略化
        fill: '#000000',
        fontSize: 20
    });

    // テキストのリサイズハンドルをいくつか非表示にする
    text.setControlsVisibility({
        mt:  false, // 四隅のリサイズハンドルを非表示
        mb:  false,
        ml:  false,
        mr:  false,
        mtr: false, // 回転ハンドルを非表示
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
}

async function loadFont(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64Font = btoa(
        new Uint8Array(buffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return base64Font;
}
window.onPressSavePDF = async function() {
    if (!pdfDoc) {
        alert('PDFがアップロードされていません。');
        return;
    }
    canvasScale = 1; // ズームをリセット
    renderPage(currentPage); // ページをリセット
    
    await exportPDF();
}

async function exportPDF() {
    const NOTO_SANS_JP = await loadFont('assets/fonts/NotoSansJP-Regular.ttf'); // フォントのURLを指定

    pdfDoc.getPage(currentPage).then(function (page) {
        const scale = canvasScale;
        const viewport = page.getViewport({ scale: 1 });

        const pdf = new jsPDF({
            orientation: viewport.width > viewport.height ? 'l' : 'p',
            unit: 'pt',
            format: [viewport.width * PDF_DPI / FABRIC_DPI, viewport.height * PDF_DPI / FABRIC_DPI] // DPIを調整
        });

        pdf.addFileToVFS("NotoSansJP-Regular.ttf", NOTO_SANS_JP);
        pdf.addFont("NotoSansJP-Regular.ttf", "Noto-Sans-JP", "normal");

        pdf.addImage(pdfCanvas, 'PNG', 0, 0, viewport.width * PDF_DPI / FABRIC_DPI, viewport.height * PDF_DPI / FABRIC_DPI); // DPIを調整

        const fabricObjects = fabricCanvas.getObjects();
        fabricObjects.forEach(function (obj) {
            if (obj.type === 'i-text') {
                pdf.setFont('Noto-Sans-JP');
                const fontSize = (obj.fontSize * obj.scaleY) * PDF_DPI / FABRIC_DPI; // DPIを調整
                pdf.setFontSize(fontSize);
                pdf.setTextColor(obj.fill);
        
                const options = {
                    angle: obj.angle,
                    align: 'left',
                    baseline: 'top'
                };
        
                pdf.text(
                    obj.text,
                    obj.left * PDF_DPI / FABRIC_DPI,  // DPIを調整
                    obj.top  * PDF_DPI / FABRIC_DPI,  // DPIを調整
                    options
                );
            }
        });

        pdf.save('output.pdf');
    });
}

// zoomIn関数の修正
window.zoomIn = function() {
    canvasScale += 0.1; // 10%拡大
    renderPage(currentPage);
};

// zoomOut関数の修正
window.zoomOut = function() {
    canvasScale -= 0.1; // 10%縮小
    renderPage(currentPage);
};

window.clickTab = function(activateTabId) {
    console.log(activateTabId);
    const tabs = document.getElementsByClassName('editor-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        console.log(tab)
        if (tab.id === activateTabId) {
            tab.classList.remove('hidden');
        } else {
            tab.classList.add('hidden');
        }
    }
}

// HTMLに拡大・縮小ボタンを追加し、イベントリスナーを設定
document.getElementById('zoom-in' ).addEventListener('click', zoomIn);
document.getElementById('zoom-out').addEventListener('click', zoomOut);
document.getElementById('index-pdf-selector'   ).addEventListener('click', () => clickTab("tab-pdf-selector"));
document.getElementById('index-scheme-selector').addEventListener('click', () => clickTab("tab-scheme-selector"));
document.getElementById('index-data-selector'  ).addEventListener('click', () => clickTab("tab-data-selector"));