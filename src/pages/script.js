import { jsPDF } from 'jspdf';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/pdf.worker.mjs';

const CMAP_URL = 'assets/cmaps/';
const CMAP_PACKED = true;
const FABRIC_DPI = 96; // Fabric.js の DPI
const PDF_DPI = 72; // jsPDF の DPI

let pdfDoc = null;
let fabricCanvas;
let pdfCanvas;

document.addEventListener('DOMContentLoaded', function() {
    fabricCanvas = new fabric.Canvas('fabric-canvas');
    const pdfUpload = document.getElementById('pdf-upload');

    // pdf-canvasを動的に作成
    pdfCanvas = document.createElement('canvas');
    pdfCanvas.id = 'pdf-canvas';
    document.getElementsByClassName('canvas-container')[0].prepend(pdfCanvas);

    pdfUpload.addEventListener('change', handleFileUpload);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'PDF保存';
    saveButton.onclick = savePDF;
    document.body.appendChild(saveButton);

    const addTextButton = document.createElement('button');
    addTextButton.textContent = 'テキスト追加';
    addTextButton.onclick = addText;
    document.body.appendChild(addTextButton);
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
        console.error('アップロードされたファイルはPDFではありません。');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);

        // CMap設定を追加
        pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: CMAP_URL,
            cMapPacked: CMAP_PACKED
        }).promise.then(function(pdf) {
            pdfDoc = pdf;
            renderPage(1);
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: pdfCanvas.getContext('2d'),
            viewport: viewport
        };
        page.render(renderContext);

        fabricCanvas.setDimensions({
            width: viewport.width,
            height: viewport.height
        });
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

window.savePDF = async function () {
    if (!pdfDoc) {
        alert('PDFがアップロードされていません。');
        return;
    }

    const NOTO_SANS_JP = await loadFont('assets/fonts/NotoSansJP-Regular.ttf'); // フォントのURLを指定

    pdfDoc.getPage(1).then(function (page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

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
                pdf.setFontSize((obj.fontSize * obj.scaleY) * PDF_DPI / FABRIC_DPI); // DPIを調整
                pdf.setTextColor(obj.fill);

                const options = {
                    angle: obj.angle,
                    align: 'left',
                    baseline: 'top'
                };

                pdf.text(
                    obj.text,
                    obj.left * PDF_DPI / FABRIC_DPI,  // DPIを調整
                    (obj.top + (obj.fontSize * obj.scaleY)) * PDF_DPI / FABRIC_DPI, // DPIを調整
                    options
                );
            }
        });

        pdf.save('edited.pdf');
    });
}
