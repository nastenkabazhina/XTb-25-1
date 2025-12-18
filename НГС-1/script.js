// Математические коэффициенты модели
const COEFFICIENTS = {
    // K1 = A - B*P + C*T - D*Q
    // При P=3.5, T=55, Q=500: K1 ≈ 85%
    A: 92,   // Базовая степень сепарации
    B: 1.2,  // Влияние давления (рост давления снижает эффективность)
    C: 0.25, // Влияние температуры (рост температуры увеличивает эффективность)
    D: 0.015, // Влияние расхода (рост расхода снижает эффективность)
    
    // K2 = E + F*P - G*T + H*Q
    // При P=3.5, T=55, Q=500: K2 ≈ 3%
    E: 3.5,   // Базовая обводненность
    F: 0.4,   // Влияние давления (рост давления увеличивает обводненность)
    G: 0.08,  // Влияние температуры (рост температуры снижает обводненность)
    H: 0.002, // Влияние расхода (рост расхода увеличивает обводненность)
    
    GOR: 100, // Gas-Oil Ratio (м³/м³)
    Q_MAX: 800 // Максимальный расчетный расход
};

// Текущие значения параметров
let state = {
    P: 3.5,  // Давление (МПа)
    T: 55,   // Температура (°C)
    Q: 500,  // Расход (м³/сут)
    K1: 0,   // Степень сепарации газа (%)
    K2: 0,   // Обводненность нефти (%)
    Q_gas: 0 // Расход газа (м³/сут)
};

let animationId = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initializeAccordion();
    initializeSliders();
    updateCalculations();
    startAnimation();
    
    // Обновление визуализации при изменении размеров окна
    window.addEventListener('resize', function() {
        drawSeparator();
    });
});

// Запуск анимации уровней жидкости
function startAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    const loop = () => {
        drawSeparator();
        animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
}

// Инициализация аккордеона
function initializeAccordion() {
    // Делаем все вкладки постоянно открытыми
    document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.add('active');
    });
}

// Инициализация ползунков
function initializeSliders() {
    const pressureSlider = document.getElementById('pressure-slider');
    const temperatureSlider = document.getElementById('temperature-slider');
    const flowrateSlider = document.getElementById('flowrate-slider');
    
    pressureSlider.addEventListener('input', function() {
        state.P = parseFloat(this.value);
        document.getElementById('pressure-value').textContent = state.P.toFixed(1);
        updateCalculations();
        drawSeparator();
    });
    
    temperatureSlider.addEventListener('input', function() {
        state.T = parseFloat(this.value);
        document.getElementById('temperature-value').textContent = state.T;
        updateCalculations();
        drawSeparator();
    });
    
    flowrateSlider.addEventListener('input', function() {
        state.Q = parseFloat(this.value);
        document.getElementById('flowrate-value').textContent = state.Q;
        updateCalculations();
        drawSeparator();
    });
}

// Расчет зависимых параметров
function updateCalculations() {
    // Расчет K1 (степень сепарации газа)
    state.K1 = COEFFICIENTS.A - COEFFICIENTS.B * state.P + 
               COEFFICIENTS.C * state.T - COEFFICIENTS.D * state.Q;
    state.K1 = Math.max(70, Math.min(99, state.K1)); // Ограничение 70-99%
    
    // Расчет K2 (обводненность нефти)
    state.K2 = COEFFICIENTS.E + COEFFICIENTS.F * state.P - 
               COEFFICIENTS.G * state.T + COEFFICIENTS.H * state.Q;
    state.K2 = Math.max(0.1, Math.min(15, state.K2)); // Ограничение 0.1-15%
    
    // Расчет Q_gas (расход газа)
    state.Q_gas = (state.Q * COEFFICIENTS.GOR * state.K1) / 100;
    
    // Обновление отображения значений
    document.getElementById('k1-value').textContent = state.K1.toFixed(1);
    document.getElementById('k2-value').textContent = state.K2.toFixed(1);
    document.getElementById('qgas-value').textContent = state.Q_gas.toFixed(1);
    
    // Обновление KPI в правой панели
    document.getElementById('kpi-k1').textContent = state.K1.toFixed(1);
    document.getElementById('kpi-k2').textContent = state.K2.toFixed(1);
    document.getElementById('kpi-qgas').textContent = state.Q_gas.toFixed(1);
    
    // Прогнозируемое давление на следующую ступень (упрощенная модель)
    const nextPressure = state.P * 0.95; // Небольшое падение давления
    document.getElementById('kpi-next-pressure').textContent = nextPressure.toFixed(2);
    
    // Проверка предупреждений
    checkWarnings();
}

// Проверка предупреждений
function checkWarnings() {
    const warnings = [];
    
    // Каплеунос: Q > Q_max ИЛИ K1 < 85%
    if (state.Q > COEFFICIENTS.Q_MAX || state.K1 < 85) {
        warnings.push('Каплеунос жидкости в газовую линию');
    }
    
    // Высокая обводненность: K2 > 5%
    if (state.K2 > 5) {
        warnings.push('Высокая обводненность нефти');
    }
    
    // Критическое давление: P > 6.3 МПа
    if (state.P > 6.3) {
        warnings.push('Давление приближается к критическому');
    }
    
    // Отображение предупреждений
    const warningsWindow = document.getElementById('warnings-window');
    const warningsContainer = document.getElementById('warnings-container');
    
    if (warnings.length > 0) {
        warningsWindow.style.display = 'block';
        warningsContainer.innerHTML = '';
        warnings.forEach(warning => {
            const warningItem = document.createElement('div');
            warningItem.className = 'warning-item';
            warningItem.textContent = warning;
            warningsContainer.appendChild(warningItem);
        });
    } else {
        warningsWindow.style.display = 'none';
    }
}

// Визуализация сепаратора на Canvas (горизонтальный тип по схеме)
function drawSeparator() {
    const canvas = document.getElementById('separator-canvas');
    const ctx = canvas.getContext('2d');
    
    // Адаптивный размер canvas
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth - 40;
    const maxHeight = container.clientHeight - 100;
    
    canvas.width = Math.min(1000, maxWidth);
    canvas.height = Math.min(550, maxHeight);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Очистка canvas
    ctx.clearRect(0, 0, width, height);
    
    // Параметры сепаратора (горизонтальный цилиндр)
    const separatorLength = width * 0.7;
    const separatorDiameter = height * 0.55;
    const separatorX = width * 0.12;
    const separatorY = height * 0.15;
    const radius = separatorDiameter / 2;
    const centerY = separatorY + radius;
    
    // Расчет уровней жидкости на основе эффективности с небольшими колебаниями
    const t = (performance.now ? performance.now() : Date.now());
    const baseWaterRatio = Math.max(0.08, Math.min(0.12, (state.K2 / 100) * 0.2));
    const baseOilRatio = 0.45;
    let waterLevelRatio = Math.min(0.16, Math.max(0.05, baseWaterRatio + 0.01 * Math.sin(t / 900)));
    let oilEmulsionLevelRatio = Math.min(0.55, Math.max(0.35, baseOilRatio + 0.015 * Math.sin(t / 1200 + 1.2)));
    let gasLevelRatio = 1 - waterLevelRatio - oilEmulsionLevelRatio;
    if (gasLevelRatio < 0.08) {
        gasLevelRatio = 0.08;
        const liquidScale = (1 - gasLevelRatio) / (waterLevelRatio + oilEmulsionLevelRatio);
        waterLevelRatio *= liquidScale;
        oilEmulsionLevelRatio *= liquidScale;
    }
    
    // Высоты слоев
    const waterHeight = separatorDiameter * waterLevelRatio;
    const oilHeight = separatorDiameter * oilEmulsionLevelRatio;
    const liquidTop = separatorY + separatorDiameter;
    const waterTop = liquidTop;
    const oilTop = waterTop - waterHeight;
    const gasTop = oilTop - oilHeight;

    // Позиция перегородки (вейра) правой части
    const weirX = separatorX + separatorLength * 0.72;
    const weirWidth = 10;
    
    // Рисование опор (4 ноги) - темно-серые/черные
    const legWidth = 18;
    const legHeight = 25;
    const legSpacing = separatorLength / 5;
    ctx.fillStyle = '#333';
    for (let i = 0; i < 4; i++) {
        const legX = separatorX + legSpacing * (i + 0.5) - legWidth / 2;
        const legY = separatorY + separatorDiameter;
        ctx.fillRect(legX, legY, legWidth, legHeight);
    }
    
    // Рисование корпуса сепаратора (горизонтальный цилиндр) - светло-серый
    ctx.strokeStyle = '#999';
    ctx.fillStyle = '#e8e8e8';
    ctx.lineWidth = 5;
    
    // Основной цилиндр (прямоугольная часть)
    ctx.beginPath();
    ctx.rect(separatorX, separatorY, separatorLength, separatorDiameter);
    ctx.fill();
    ctx.stroke();
    
    // Закругленные концы
    ctx.beginPath();
    ctx.arc(separatorX, centerY, radius, Math.PI / 2, -Math.PI / 2, false);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(separatorX + separatorLength, centerY, radius, -Math.PI / 2, Math.PI / 2, false);
    ctx.fill();
    ctx.stroke();
    
    // Рисование слоя воды (светло-синий, внизу - тонкий слой) — только до перегородки
    if (waterHeight > 1) {
        ctx.fillStyle = 'rgba(173, 216, 230, 0.75)'; // Светло-голубой
        // Основной прямоугольник (закругления видны через корпус)
        ctx.fillRect(separatorX, waterTop - waterHeight, weirX - separatorX, waterHeight);
    }
    
    // Рисование слоя нефти/эмульсии (черный)
    if (oilHeight > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        // Основной прямоугольник
        ctx.fillRect(separatorX, oilTop - oilHeight, separatorLength, oilHeight);
    }
    
    // Граница между водой и нефтью (белая линия)
    if (waterHeight > 1 && oilHeight > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(separatorX, oilTop);
        ctx.lineTo(separatorX + separatorLength, oilTop);
        ctx.stroke();
    }
    
    // Газовое пространство (верхняя часть) - прозрачное с индикацией качества
    const gasQuality = state.K1 / 100;
    const gasOpacity = 0.15 + (gasQuality - 0.7) * 0.25 / 0.29;
    ctx.fillStyle = `rgba(200, 220, 255, ${gasOpacity})`;
    // Основной прямоугольник
    ctx.fillRect(separatorX, separatorY, separatorLength, gasTop - separatorY);
    
    // Внутренние компоненты
    
    // 1. Вертикальная перегородка/вейр (справа, опущена до низа, высота прежняя)
    const weirHeight = separatorDiameter * 0.65; // сохранить высоту
    const weirBottom = separatorY + separatorDiameter; // у основания
    const weirTop = weirBottom - weirHeight;
    ctx.fillStyle = '#555';
    ctx.fillRect(weirX, weirTop, weirWidth, weirBottom - weirTop);
    
    // 2. Демистер/туманоуловитель (верхний правый угол, прямоугольник с сеткой)
    const demisterX = separatorX + separatorLength * 0.78;
    const demisterY = separatorY + 15;
    const demisterWidth = separatorLength * 0.18;
    const demisterHeight = 45;
    ctx.fillStyle = '#bbb';
    ctx.fillRect(demisterX, demisterY, demisterWidth, demisterHeight);
    // Сетчатый паттерн (вертикальные и горизонтальные линии)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    for (let x = demisterX + 5; x < demisterX + demisterWidth; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, demisterY);
        ctx.lineTo(x, demisterY + demisterHeight);
        ctx.stroke();
    }
    for (let y = demisterY + 5; y < demisterY + demisterHeight; y += 10) {
        ctx.beginPath();
        ctx.moveTo(demisterX, y);
        ctx.lineTo(demisterX + demisterWidth, y);
        ctx.stroke();
    }
    
    // Визуализация пузырьков в жидкости (при низкой эффективности)
    if (state.K1 < 90) {
        drawBubbles(ctx, separatorX, gasTop, separatorLength, 
                   separatorDiameter - (gasTop - separatorY), 1 - gasQuality);
    }
    
    // Входной поток (слева, горизонтально) - белая труба с желтой стрелкой
    const inletX = separatorX - 50;
    const inletY = centerY;
    // Труба (белая)
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(inletX, inletY);
    ctx.lineTo(separatorX, inletY);
    ctx.stroke();
    // Желтая стрелка и подпись
    drawFlowArrow(ctx, inletX - 35, inletY, inletX, inletY, '#ffd700', state.Q / 1000);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Нефтяная эмульсия', inletX - 18, inletY - 18);
    
    // Выход газа (верхний правый, вертикально вверх) - над демистером
    const gasOutX = separatorX + separatorLength * 0.87;
    const gasOutY = separatorY - 45;
    // Труба (белая)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(gasOutX, separatorY);
    ctx.lineTo(gasOutX, gasOutY);
    ctx.stroke();
    // Подпись без желтой полосы/стрелки
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Газ', gasOutX -45, gasOutY - 12);
    
    // Выход нефти (нижний правый, вертикально вниз) - справа от вейра
    const oilOutX = separatorX + separatorLength * 0.88;
    const oilOutY = separatorY + separatorDiameter + 45;
    // Труба (белая)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(oilOutX, separatorY + separatorDiameter);
    ctx.lineTo(oilOutX, oilOutY);
    ctx.stroke();
    // Желтая стрелка вниз и подпись
    drawFlowArrowVertical(ctx, oilOutX, separatorY + separatorDiameter, oilOutX, oilOutY, 
                         '#ffd700', (state.Q * (1 - state.K2/100)) / 1000, false);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Нефть', oilOutX, oilOutY + 22);
    
    // Выход воды (нижний центр, вертикально вниз) - под синим слоем
    const waterOutX = separatorX + separatorLength * 0.5;
    const waterOutY = separatorY + separatorDiameter + 45;
    // Труба (белая)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(waterOutX, separatorY + separatorDiameter);
    ctx.lineTo(waterOutX, waterOutY);
    ctx.stroke();
    // Желтая стрелка вниз и подпись
    drawFlowArrowVertical(ctx, waterOutX, separatorY + separatorDiameter, waterOutX, waterOutY, 
                         '#ffd700', (state.Q * state.K2/100) / 1000, false);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Вода', waterOutX, waterOutY + 22);
    
    // Фланцы/соединения на верхней части (небольшие круги)
    ctx.fillStyle = '#999';
    const flangePositions = [0.25, 0.45, 0.65];
    flangePositions.forEach(pos => {
        const flangeX = separatorX + separatorLength * pos;
        ctx.beginPath();
        ctx.arc(flangeX, separatorY, 10, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Подписи уровней (опционально, можно убрать для чистоты)
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('Газ', separatorX + 8, separatorY + 18);
    ctx.fillText('Нефть/Эмульсия', separatorX + 8, centerY - 5);
    ctx.fillText('Вода', separatorX + 8, separatorY + separatorDiameter - 8);
    
    // Индикация эффективности внизу
    ctx.font = '11px Arial';
    ctx.fillStyle = '#2a5298';
    ctx.textAlign = 'center';
    ctx.fillText(`K1: ${state.K1.toFixed(1)}%`, separatorX + separatorLength / 2, separatorY + separatorDiameter + 28);
    ctx.fillText(`K2: ${state.K2.toFixed(1)}%`, separatorX + separatorLength / 2, separatorY + separatorDiameter + 42);
}

// Рисование стрелки потока
function drawFlowArrow(ctx, x1, y1, x2, y2, color, intensity) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, intensity * 10);
    
    // Линия потока
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Стрелка
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 15;
    const arrowWidth = 8;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), 
               y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), 
               y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    // Индикация интенсивности потока (точки)
    if (intensity > 0.3) {
        const numDots = Math.floor(intensity * 5);
        for (let i = 0; i < numDots; i++) {
            const t = (i + 1) / (numDots + 1);
            const dotX = x1 + (x2 - x1) * t;
            const dotY = y1 + (y2 - y1) * t;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Рисование вертикальной стрелки потока
function drawFlowArrowVertical(ctx, x1, y1, x2, y2, color, intensity, upward) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, intensity * 10);
    
    // Линия потока
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Стрелка (направление зависит от параметра upward)
    const arrowLength = 15;
    const arrowWidth = 8;
    const direction = upward ? -1 : 1;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowWidth, y2 - direction * arrowLength);
    ctx.lineTo(x2 + arrowWidth, y2 - direction * arrowLength);
    ctx.closePath();
    ctx.fill();
    
    // Индикация интенсивности потока (точки)
    if (intensity > 0.3) {
        const numDots = Math.floor(intensity * 5);
        for (let i = 0; i < numDots; i++) {
            const t = (i + 1) / (numDots + 1);
            const dotX = x1 + (x2 - x1) * t;
            const dotY = y1 + (y2 - y1) * t;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Рисование пузырьков в жидкости
function drawBubbles(ctx, x, y, width, height, intensity) {
    const numBubbles = Math.floor(intensity * 20);
    
    for (let i = 0; i < numBubbles; i++) {
        const bubbleX = x + Math.random() * width;
        const bubbleY = y + Math.random() * height;
        const bubbleSize = 3 + Math.random() * 5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Отражение света на пузырьке
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(bubbleX - bubbleSize * 0.3, bubbleY - bubbleSize * 0.3, 
               bubbleSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

