// Константы модели
const V_CRIT = 0.14;  // критическая скорость, м/с
const V_MAX = 0.8;    // максимальная скорость, м/с
const T_CRITICAL = 70; // критическая температура, °C

// Текущие значения параметров
let currentV = 0.14;
let currentT_vh = 10;
let simulationTime = 0;
let animationFrameId = null;

// Элементы DOM
const vSlider = document.getElementById('v-slider');
const tvhSlider = document.getElementById('tvh-slider');
const vValue = document.getElementById('v-value');
const tvhValue = document.getElementById('tvh-value');
const toutDisplay = document.getElementById('tout-display');
const formulaText = document.getElementById('formula-text');
const forecastContent = document.getElementById('forecast-content');
const flowAnimation1 = document.getElementById('flow-animation-1');
const coilPath = document.getElementById('coil-path');
const gradientStart = document.getElementById('gradient-start');
const gradientEnd = document.getElementById('gradient-end');
const inputTempLabel = document.getElementById('input-temp-label');
const outputTempLabel = document.getElementById('output-temp-label');
const flowParticles = [
    document.getElementById('flow-particle-1'),
    document.getElementById('flow-particle-2'),
    document.getElementById('flow-particle-3'),
    document.getElementById('flow-particle-4'),
    document.getElementById('flow-particle-5')
];

// Математическая модель
function calculateT_settled(V, T_vh) {
    if (V <= V_CRIT) {
        return 20 + 0.4 * (T_vh - 10);
    }
    const ratio = (V - V_CRIT) / (V_MAX - V_CRIT);
    return 20 + 50 * Math.pow(ratio, 0.8) + 0.4 * (T_vh - 10);
}

function calculateT_70(V, T_vh) {
    const T_settled = calculateT_settled(V, T_vh);
    if (T_settled <= T_CRITICAL) {
        return Infinity; // никогда не достигнет 70°C
    }
    if (V <= V_CRIT) {
        return Infinity; // критическая скорость, не достигнет 70°C
    }
    // Формула возвращает время в минутах
    return 1.2 / Math.pow(V - V_CRIT, 0.8) + 8;
}

function calculateTau(T_settled, T_vh, t_70_minutes) {
    if (T_settled <= T_CRITICAL || t_70_minutes === Infinity) {
        // Если установившаяся температура ниже критической, используем другую формулу
        // для расчета времени выхода на установившийся режим
        const tempDiff = T_settled - T_vh;
        if (tempDiff <= 0) {
            return Infinity;
        }
        // Время достижения 95% от установившейся температуры (в секундах)
        return 300; // 5 минут в секундах для перехода
    }
    const numerator = T_settled - T_vh;
    const denominator = T_settled - T_CRITICAL;
    if (denominator <= 0 || numerator <= 0) {
        return Infinity;
    }
    const logValue = Math.log(numerator / denominator);
    if (logValue <= 0 || !isFinite(logValue)) {
        return Infinity;
    }
    // t_70 в минутах, преобразуем в секунды для tau
    return (t_70_minutes * 60) / logValue;
}

function calculateT_current(t, T_settled, T_vh, tau) {
    if (tau === Infinity || tau <= 0 || !isFinite(tau)) {
        // Если тау бесконечен, температура сразу равна установившейся
        // или медленно приближается к ней
        if (T_settled > T_vh) {
            // Медленное приближение
            const slowTau = 300; // 5 минут
            return T_vh + (T_settled - T_vh) * (1 - Math.exp(-t / slowTau));
        }
        return T_settled;
    }
    const expValue = Math.exp(-t / tau);
    if (!isFinite(expValue)) {
        return T_settled;
    }
    return T_settled - (T_settled - T_vh) * expValue;
}

// Обновление визуализации
function updateVisualization() {
    const T_settled = calculateT_settled(currentV, currentT_vh);
    const t_70_minutes = calculateT_70(currentV, currentT_vh);
    const tau = calculateTau(T_settled, currentT_vh, t_70_minutes);
    const T_current = calculateT_current(simulationTime, T_settled, currentT_vh, tau);
    
    // Обновление температуры на выходе
    toutDisplay.textContent = T_current.toFixed(1) + '°C';
    
    // Цветовая индикация температуры (от синего к красному)
    const normalizedTemp = Math.min(Math.max((T_current - 10) / 80, 0), 1);
    const red = Math.floor(normalizedTemp * 255);
    const blue = Math.floor((1 - normalizedTemp) * 255);
    const color = `rgb(${red}, 0, ${blue})`;
    
    // Применение цвета к змеевику — фиксированный чёрный
    coilPath.setAttribute('stroke', '#000');
    // Оставляем изменения градиента для других визуальных элементов при необходимости
    gradientStart.setAttribute('stop-color', `rgb(${Math.floor((1 - normalizedTemp) * 255)}, 0, ${blue})`);
    gradientEnd.setAttribute('stop-color', `rgb(${red}, 0, ${Math.floor((1 - normalizedTemp) * 255)})`);
    
    // Обновление меток температуры
    inputTempLabel.textContent = `T_вх = ${currentT_vh.toFixed(1)}°C`;
    outputTempLabel.textContent = `T_out = ${T_current.toFixed(1)}°C`;
    
    // Анимация потока (скорость зависит от V)
    const baseDuration = 3; // секунды
    const speedFactor = Math.max(0.1, currentV / V_MAX);
    const animationDuration = baseDuration / speedFactor;
    
    // Обновляем скорость всех частиц потока
    if (flowAnimation1) {
        flowAnimation1.setAttribute('dur', animationDuration + 's');
    }
    // Обновляем остальные частицы через их animateMotion элементы
    const delays = [0, 0.3, 0.6, 0.9, 1.2];
    flowParticles.forEach((particle, index) => {
        if (particle) {
            const anim = particle.querySelector('animateMotion');
            if (anim) {
                anim.setAttribute('dur', animationDuration + 's');
                anim.setAttribute('begin', (delays[index] * animationDuration / baseDuration) + 's');
            }
        }
    });
    
    // Обновление формулы
    if (currentV <= V_CRIT) {
        const tempPart = (0.4 * (currentT_vh - 10)).toFixed(1);
        formulaText.innerHTML = `
            T_settled = 20 + 0.4 × (${currentT_vh.toFixed(1)} - 10)<br>
            T_settled = 20 + ${tempPart} = <strong>${T_settled.toFixed(1)}°C</strong><br>
            <span style="color: #666; font-size: 0.9em;">(При V ≤ ${V_CRIT} м/с скорость критическая, дополнительный нагрев отсутствует)</span>
        `;
    } else {
        const ratio = ((currentV - V_CRIT) / (V_MAX - V_CRIT)).toFixed(3);
        const ratioPower = Math.pow((currentV - V_CRIT) / (V_MAX - V_CRIT), 0.8).toFixed(3);
        const tempPart = (0.4 * (currentT_vh - 10)).toFixed(1);
        const speedPart = (50 * Math.pow((currentV - V_CRIT) / (V_MAX - V_CRIT), 0.8)).toFixed(1);
        
        formulaText.innerHTML = `
            T_settled = 20 + 50 × ((${currentV.toFixed(2)} - ${V_CRIT}) / ${(V_MAX - V_CRIT).toFixed(2)})<sup>0.8</sup> + 0.4 × (${currentT_vh.toFixed(1)} - 10)<br>
            T_settled = 20 + 50 × ${ratioPower} + ${tempPart}<br>
            T_settled = 20 + ${speedPart} + ${tempPart} = <strong>${T_settled.toFixed(1)}°C</strong>
        `;
    }
    
    // Обновление прогнозов
    updateForecast(T_settled, t_70_minutes, T_current);
}

    // Система прогнозов
function updateForecast(T_settled, t_70_minutes, T_current) {
    let forecastHTML = '';
    let alarmStatus = 'normal'; // Определяем статус для localStorage
    
    // Определение режима работы на основе скорости
    // t_70_minutes уже в минутах
    
    // Случай 1 (скорость 0.14)
    if (currentV <= 0.14) {
        forecastHTML = `
            <p>Система не достигает 70°C ни в переходном, ни в установившемся режиме. Риск перегрева отсутствует даже при круглосуточной работе. Система обладает максимальным запасом по температуре и времени.</p>
        `;
        alarmStatus = 'alarm'; // Критическая скорость
    } 
    // Случай 2 (скорость 0.15)
    else if (currentV <= 0.15) {
        forecastHTML = `
            <p>Система не достигает 70°C ни в переходном, ни в установившемся режиме. Риск перегрева отсутствует даже при круглосуточной работе.</p>
        `;
    } 
    // Случай 3 (скорость 0.18)
    else if (currentV <= 0.18) {
        forecastHTML = `
            <p>Система не достигает 70°C ни в переходном, ни в установившемся режиме. Риск перегрева отсутствует даже при круглосуточной работе.</p>
        `;
    } 
    // Случай 4 (скорость 0.20)
    else if (currentV <= 0.20) {
        forecastHTML = `
            <p>Режим повышенной производительности с сохранением безопасных параметров. Риск перегрева отсутствует даже при круглосуточной работе. Наблюдается незначительное увеличение тепловых потерь.</p>
        `;
    } 
    // Случай 5 (скорость 0.25)
    else if (currentV <= 0.25) {
        forecastHTML = `
            <p>Высокопроизводительный режим, приближающийся к границе безопасной зоны. Риск перегрева отсутствует даже при круглосуточной работе. Система становится более чувствительной к возмущениям. Увеличивается тепловая нагрузка на оборудование.</p>
        `;
    } 
    // Случай 6 (скорость 0.30)
    else if (currentV <= 0.30) {
        forecastHTML = `
            <p>Предельный безопасный режим с минимальным запасом по температуре. Риск перегрева отсутствует даже при круглосуточной работе. Наблюдается повышенный износ нагревательных элементов. Требуется высококачественная автоматика для поддержания стабильности.</p>
        `;
    } 
    // Случай 7 (скорость 0.35)
    else if (currentV <= 0.35) {
        const timeToMax = t_70_minutes === Infinity ? 41.2 : t_70_minutes.toFixed(1);
        forecastHTML = `
            <p>Критически близкий к аварийному порогу режим работы. Система функционирует с запасом по температуре. Любое незначительное возмущение может привести к превышению критического значения 70°C. Температура достигнет максимального предельного значения через ${timeToMax} минут. Стабильность работы низкая.</p>
        `;
        alarmStatus = 'alarm'; // Критически близкий к аварии
    } 
    // Случай 8 (скорость 0.40)
    else if (currentV <= 0.40) {
        const timeToMax = t_70_minutes === Infinity ? 14.7 : t_70_minutes.toFixed(1);
        forecastHTML = `
            <p>Начальная стадия аварийного режима. Система стабильно превышает критическую температуру. Динамика нагрева экстремально быстрая - температура достигает максимума за ${timeToMax} минут. Система работает в нерасчетном режиме с непредсказуемой динамикой.</p>
        `;
        alarmStatus = 'alarm'; // Аварийный режим
    } 
    // Случай 9 (скорость 0.50)
    else if (currentV <= 0.50) {
        const timeToMax = t_70_minutes === Infinity ? 7.5 : t_70_minutes.toFixed(1);
        forecastHTML = `
            <p>Опасный перегрев системы с превышением критической температуры. Тепловая нагрузка на оборудование достигает предельных значений. Температура достигнет максимального предельного значения через ${timeToMax} минут.</p>
        `;
        alarmStatus = 'alarm'; // Опасный перегрев
    } 
    // Случай 10 (скорость 0.60)
    else if (currentV <= 0.60) {
        const timeToMax = t_70_minutes === Infinity ? 5.1 : t_70_minutes.toFixed(1);
        forecastHTML = `
            <p>Создаются условия для парообразования в системе, что может привести к гидравлическим ударам и разрушению трубопроводов. Высокий риск теплового взрыва при наличии замкнутых объемов. Температура достигнет максимального предельного значения через ${timeToMax} минут.</p>
        `;
        alarmStatus = 'alarm'; // Критический перегрев
    } 
    // Случай 11 (скорость 0.80)
    else {
        const timeToMax = t_70_minutes === Infinity ? 3.4 : t_70_minutes.toFixed(1);
        forecastHTML = `
            <p>Катастрофический режим работы, представляющий непосредственную угрозу жизни персонала и целостности сооружений. Температура достигнет максимального предельного значения через ${timeToMax} минут. Система переходит в режим неуправляемого разгона, когда выделение тепла превышает возможности отвода на несколько порядков.</p>
        `;
        alarmStatus = 'alarm'; // Катастрофический режим
    }
    
    forecastContent.innerHTML = forecastHTML;
    
    // Записываем статус в localStorage для главной страницы
    try {
        localStorage.setItem('mupn_status_П-1', JSON.stringify({
            status: alarmStatus,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Ошибка записи статуса в localStorage:', e);
    }
}

// Симуляция времени
function startSimulation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    simulationTime = 0;
    
    function animate() {
        simulationTime += 0.1; // увеличиваем время на 0.1 секунды за кадр
        updateVisualization();
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

// Функция сброса симуляции
function resetSimulation() {
    simulationTime = 0;
}

// Обработчики событий
vSlider.addEventListener('input', (e) => {
    currentV = parseFloat(e.target.value);
    vValue.textContent = currentV.toFixed(2) + ' м/с';
    resetSimulation();
    updateVisualization();
});

tvhSlider.addEventListener('input', (e) => {
    currentT_vh = parseFloat(e.target.value);
    tvhValue.textContent = currentT_vh.toFixed(1) + '°C';
    resetSimulation();
    updateVisualization();
});

// Инициализация
vValue.textContent = currentV.toFixed(2) + ' м/с';
tvhValue.textContent = currentT_vh.toFixed(1) + '°C';
updateVisualization();
startSimulation();

