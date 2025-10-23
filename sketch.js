// Justin Chambers
// 4/2018

var sunHeightRatio = 0.35; // 太陽高度佔畫布高度的比例 (稍微調低，更接近地平線)
var sunSizeRatio = 0.30;    // 太陽大小佔畫布尺寸的比例 (稍微調大)
var gradientSteps = 15;     // 增加梯度步數，讓漸變更平滑

var noiseScale = 0.05;      // 降低噪點規模，讓水波變化更平緩、細緻
var waveMovementSpeed = 1.5; // 稍微降低波浪移動速度

var waterStrokeWeight = 3;  // 顯著減小線條粗細，讓像素更小
var waterStride = 6;        // 顯著減小線段間距，讓像素更小
var currentWork = 1; // 1: 作品一(預設), 2: 作品二(海洋), 3: 作品三(夕陽變體)

// palettes: each entry contains colors used by the draw/setup logic
var palettes = {
    1: {
        // 原本的夕陽 (作品一)
        skyBase: [80,40,30],
        skyFrom: [150,60,40],
        skyTo: [255,180,90],
        horizonFrom: [255,150,80,50],
        horizonTo: [120,50,30,30],
        sunFrom: [255,220,160],
        sunTo: [255,255,220],
        reflection: [255,140,80],
        highlight: [255,240,200],
        waterLow: [20,30,50],
        waterHigh: [60,75,100]
    },
    2: {
        // 海洋色調 (作品二)
        skyBase: [10,30,50],
        skyFrom: [20,100,160],
        skyTo: [120,200,230],
        horizonFrom: [180,220,240,40],
        horizonTo: [20,60,90,30],
        sunFrom: [200,230,255],
        sunTo: [255,255,255],
        reflection: [140,220,240],
        highlight: [220,250,255],
        waterLow: [5,30,60],
        waterHigh: [20,90,140]
    },
    3: {
        // 夕陽變體 (作品三) — 更強烈的橙紅
        skyBase: [60,25,20],
        skyFrom: [170,70,40],
        skyTo: [255,120,60],
        horizonFrom: [255,180,120,60],
        horizonTo: [100,40,25,30],
        sunFrom: [255,200,120],
        sunTo: [255,245,200],
        reflection: [255,120,60],
        highlight: [255,230,180],
        waterLow: [15,25,40],
        waterHigh: [50,70,95]
    }
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    background(100);
    noStroke();

    var sunHeight = height * sunHeightRatio;
    var sunSize = width * sunSizeRatio;
    var halfCanvasSize = width * 0.5;

    // 使用 palette
    var p = palettes[currentWork];

    // sky background
    fill(p.skyBase[0], p.skyBase[1], p.skyBase[2]);
    rect(0, 0, width, height);

    // sky burst (漸變)
    var from = color(p.skyFrom[0], p.skyFrom[1], p.skyFrom[2]);
    var to = color(p.skyTo[0], p.skyTo[1], p.skyTo[2]);
    for (var i = gradientSteps; i > 0; --i) {
        var size = map(i, gradientSteps, 0, width * 1.2, sunSize * 0.8); // 稍微加大光暈範圍
        fill(lerpColor(from, to, 1 - i / gradientSteps));
        ellipse(halfCanvasSize, sunHeight, size, size);
    }

    // horizon fades (柔和的水平線光暈，更偏暖色)
    from = color(p.horizonFrom[0], p.horizonFrom[1], p.horizonFrom[2], p.horizonFrom[3]);
    to = color(p.horizonTo[0], p.horizonTo[1], p.horizonTo[2], p.horizonTo[3]);
    for (var i = gradientSteps; i > 0; --i) {
        var sizeX = map(i, gradientSteps, 0, width * 0.8, halfCanvasSize * 0.5); // 調整範圍
        var sizeY = map(i, gradientSteps, 0, height * 0.2, 10); // 垂直尺寸基於 height
        var posOffset = map(i, gradientSteps, 0, halfCanvasSize * 0.5, halfCanvasSize * 0.8); // 調整偏移量
        fill(lerpColor(from, to, 1 - i / gradientSteps));
        ellipse(halfCanvasSize - posOffset, sunHeight, sizeX, sizeY);
        ellipse(halfCanvasSize + posOffset, sunHeight, sizeX, sizeY);
    }

    // sun (夕陽核心，更偏暖黃和白色)
    from = color(p.sunFrom[0], p.sunFrom[1], p.sunFrom[2]);
    to = color(p.sunTo[0], p.sunTo[1], p.sunTo[2]);
    for (var i = gradientSteps; i > 0; --i) {
        var size = map(i, gradientSteps, 0, sunSize, 0);
        fill(lerpColor(from, to, 1 - i / gradientSteps));
        ellipse(halfCanvasSize, sunHeight, size, size);
    }
    
        strokeWeight(waterStrokeWeight);

        // initialize DOM listeners (only once)
        if (typeof initMenuListeners === 'undefined') {
            initMenuListeners = function() {
                var ids = ['work1','work2','work3'];
                ids.forEach(function(id, idx){
                    var el = document.getElementById(id);
                    if (!el) return;
                    el.addEventListener('click', function(){
                        selectWork(idx+1);
                    });
                });
            };
            initMenuListeners();
        }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup(); 
}

function draw() {
    var sunHeight = height * sunHeightRatio;
    var sunSize = width * sunSizeRatio;
    var halfCanvasSize = width * 0.5;

    var p = palettes[currentWork];

    var lineToggle = 0;
    // 調整反射的半寬度，讓它更自然地擴散
    var reflectionHalfWidth = sunSize * 1.2; 
    
    // 顏色來自 palette
    var reflectionColor = color(p.reflection[0], p.reflection[1], p.reflection[2]);
    var highlightColor = color(p.highlight[0], p.highlight[1], p.highlight[2]);
    
    var waterLowColor = color(p.waterLow[0], p.waterLow[1], p.waterLow[2]);
    var waterHighColor = color(p.waterHigh[0], p.waterHigh[1], p.waterHigh[2]);

    var noiseZInput = frameCount / 100 * waveMovementSpeed;
    
    for (var yPos = sunHeight + waterStrokeWeight; yPos < height + waterStrokeWeight; yPos += waterStrokeWeight) {
        var yPosMap01 = map(yPos, sunHeight, height, 0, 1);
        var noiseYInput = noiseScale * (yPos * map(yPos, sunHeight, height, 1.5, 1) - frameCount / 3) * waveMovementSpeed;
        
        for (var xPos = lineToggle; xPos <= width - lineToggle; xPos += waterStride) {
            var noiseXInput = noiseScale * ((xPos - (1 - yPosMap01) * halfCanvasSize / 2) + waterStride * 0.5) / (yPosMap01 * 10 + 1);
            var noiseVal = noise(noiseXInput, noiseYInput, noiseZInput);
            
            // 調整噪點對比度，讓亮點更明顯，但不要過度集中
            var noiseValIncreasedContrast = constrain(map(noiseVal, 0.2, 0.7, 0, 1), 0, 1); 
            
            // 計算與太陽中心的距離，用於柔化反射邊緣，避免「立桿」感
            var distFromSunCenter = abs(halfCanvasSize - xPos + lineToggle);
            var reflectionAttenuation = map(distFromSunCenter, 0, reflectionHalfWidth * (yPosMap01 + 0.4), 1, 0); // 越遠越暗
            reflectionAttenuation = constrain(reflectionAttenuation, 0, 1); // 確保在 0-1 之間

            // base water color
            var c = lerpColor(waterLowColor, waterHighColor, noiseVal * 0.7); // 讓水本身顏色更深一點

            // primary reflection color (結合噪點和衰減)
            // 讓反射更自然地擴散，而不是集中成一條
            c = lerpColor(c, reflectionColor, noiseValIncreasedContrast * reflectionAttenuation * 2); // 乘以2增加亮度

            // secondary highlight color (結合噪點和衰減，增加水的亮點)
            // 特別強調靠近太陽的區域
            var sunNearnessHighlight = pow(1 - yPosMap01, 6) * reflectionAttenuation * 1.5; // 靠近太陽的區域更亮
            c = lerpColor(c, highlightColor, (noiseValIncreasedContrast * 0.8 + sunNearnessHighlight) * reflectionAttenuation);

            // draw the line segment
            stroke(c);
            line(xPos, yPos, xPos + waterStride, yPos);
        }
        lineToggle = lineToggle == 0 ? -waterStride / 2 : 0;
    }

        // 作品三顯示中央文字
        if (currentWork === 3) {
            push();
            textAlign(CENTER, CENTER);
            textSize(Math.max(28, width * 0.035));
            fill(255, 255, 255, 220);
            stroke(0, 60);
            strokeWeight(3);
            text('謝沐珊的網站', width / 2, height / 2);
            pop();
        }
}

// 切換作品，更新 currentWork 並更新選單樣式
function selectWork(n) {
    if (currentWork === n) return;
    currentWork = n;

    // update menu UI
    ['work1','work2','work3'].forEach(function(id, idx){
        var el = document.getElementById(id);
        if (!el) return;
        if (idx+1 === n) el.classList.add('active'); else el.classList.remove('active');
    });

    var iframe = document.getElementById('work1Frame');
    if (n === 1 || n === 2) {
        // 作品一、二都顯示 iframe，但網址不同
        var target = n === 1
            ? 'https://951121yvonne.github.io/20251014--/'
            : 'https://hackmd.io/@wTKBN8_3R_CaYngGb9pZrQ/SymgKOJ2xg';
        if (iframe) {
            if (iframe.getAttribute('src') !== target) iframe.setAttribute('src', target);
            iframe.removeAttribute('hidden');
        }
    } else {
        // 作品三顯示 canvas
        if (iframe) iframe.setAttribute('hidden', '');
        setup();
    }
}