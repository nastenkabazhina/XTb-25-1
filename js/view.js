/**
 * View - Presentation Layer
 * Отвечает за отображение данных и взаимодействие с DOM
 */

class SeparatorView {
  constructor() {
    this.elements = this.getElements();
    this.alertTimer = null;
  }
  
  /**
   * Получение ссылок на DOM элементы
   */
  getElements() {
    return {
      // Контролы клапана газа (регулятор давления)
      gas: document.getElementById('gas'),
      gasVal: document.getElementById('gasVal'),
      pressureVal: document.getElementById('pressureVal'),
      
      // Контролы клапана воды (регулятор уровня воды)
      waterLevelK: document.getElementById('waterLevelK'),
      waterLevelKVal: document.getElementById('waterLevelKVal'),
      waterLevelVal: document.getElementById('waterLevelVal'),
      
      // Контролы клапана нефти (регулятор уровня нефти)
      oilLevelK: document.getElementById('oilLevelK'),
      oilLevelKVal: document.getElementById('oilLevelKVal'),
      oilLevelVal: document.getElementById('oilLevelVal'),
      
      // Визуализация
      waterLayer: document.getElementById('waterLayer'),
      oilLayer: document.getElementById('oilLayer'),
      gasLayer: document.getElementById('gasLayer'),
      oilLayerAfterBaffle: document.getElementById('oilLayerAfterBaffle'),
      gasLevelText: document.getElementById('gasLevelText'),
      oilLevelText: document.getElementById('oilLevelText'),
      waterLevelText: document.getElementById('waterLevelText'),
      inletFlowText: document.getElementById('inletFlowText'),
      
      // Клапаны
      waterValve: document.getElementById('waterValve'),
      oilValve: document.getElementById('oilValve'),
      gasValve: document.getElementById('gasValve'),
      
      // Трубы
      inletPipe: document.getElementById('inletPipe'),
      waterPipe: document.getElementById('waterPipe'),
      waterPipe2: document.getElementById('waterPipe2'),
      oilPipe: document.getElementById('oilPipe'),
      oilPipe2: document.getElementById('oilPipe2'),
      gasPipe: document.getElementById('gasPipe'),
      gasPipe2: document.getElementById('gasPipe2'),
      // Эмульсионная входная труба (SVG потоки)
      emulsionFlows: document.querySelectorAll('.emulsion-flow'),
      emulsionWaterFlows: document.querySelectorAll('.emulsion-water-flow'),
      emulsionOilFlows: document.querySelectorAll('.emulsion-oil-flow'),
      
      // Насос
      pump: document.getElementById('pump'),
      
      // Алерты и рекомендации
      alert: document.getElementById('alertBox'),
      recommendationContent: document.getElementById('recommendationContent')
      ,
      // Индикатор давления в МПа
      pressureMPa: document.getElementById('pressureMPa')
    };
  }
  
  /**
   * Форматирование чисел
   */
  format(value, digits = 1) {
    return Number(value).toFixed(digits);
  }
  
  /**
   * Обновление значений в контролах
   */
  updateControlValue(elementId, value) {
    const el = this.elements[elementId];
    if (el) {
      if (el.tagName === 'INPUT') {
        el.value = value;
      } else {
        el.textContent = value;
      }
    }
  }
  
  /**
   * Обновление давления
   */
  updatePressure(pressure) {
    // `pressure` приходит в МПа (МегаПаскали)
    // kPa = MPa * 1000, Pa = MPa * 1_000_000
    const kPa = Number(pressure) * 1000;
    const formattedKpa = this.format(kPa, 0);
    if (this.elements.pressureOut) {
      this.elements.pressureOut.textContent = formattedKpa + " кПа";
    }
    if (this.elements.pressureMPa) {
      this.elements.pressureMPa.textContent = this.format(pressure, 3) + " МПа";
    }
  }
  
  /**
   * Обновление уровня воды (в миллиметрах)
   * Примечание: отображение уровня воды происходит в updateSeparatorLevels
   */
  updateWaterLevelMM(levelMM) {
    // Метод оставлен для совместимости с контроллером
    // Фактическое отображение происходит в updateSeparatorLevels
  }
  
  /**
   * Обновление уровня нефти
   * Примечание: отображение уровня нефти происходит в updateSeparatorLevels
   */
  updateOilLevel(level) {
    // Метод оставлен для совместимости с контроллером
    // Фактическое отображение происходит в updateSeparatorLevels
  }
  
  /**
   * Обновление визуализации уровней в сепараторе
   */
  updateSeparatorLevels(waterLevel, oilLevel, gasLevel, waterLevelMM, oilLevelMM) {
    // Нормализация чтобы сумма не превышала 100%
    const total = waterLevel + oilLevel + gasLevel;
    if (total > 100) {
      const k = 100 / total;
      waterLevel *= k;
      oilLevel *= k;
      gasLevel *= k;
    }
    
    // Высота перегородки - 50% от высоты сепаратора
    const baffleHeight = 50;
    
    // Расчет суммарного уровня воды и нефти до перегородки
    const combinedLevel = waterLevel + oilLevel;
    
    // Логика перелива нефти через перегородку
    let oilAfterBaffleLevel = 0;
    let oilBeforeBaffleLevel = oilLevel;
    
    if (combinedLevel > baffleHeight) {
      // Если суммарный уровень выше перегородки, нефть переливается
      const overflow = combinedLevel - baffleHeight;
      
      if (overflow <= oilLevel) {
        // Часть нефти переливается за перегородку
        oilAfterBaffleLevel = overflow;
        oilBeforeBaffleLevel = oilLevel - overflow;
      } else {
        // Вся нефть переливается за перегородку
        oilAfterBaffleLevel = oilLevel;
        oilBeforeBaffleLevel = 0;
      }
    }
    
    // Обновление слоев до перегородки
    this.elements.waterLayer.style.height = waterLevel + "%";
    this.elements.oilLayer.style.height = oilBeforeBaffleLevel + "%";
    this.elements.oilLayer.style.bottom = waterLevel + "%";
    
    // Обновление слоя нефти после перегородки
    this.elements.oilLayerAfterBaffle.style.height = oilAfterBaffleLevel + "%";
    
    // Газовый слой остается без изменений
    this.elements.gasLayer.style.height = gasLevel + "%";
    
    // Отображение в правой панели: если переданы mm-значения, показываем мм, иначе - проценты
    if (typeof waterLevelMM === 'number') {
      this.elements.waterLevelText.textContent = this.format(waterLevelMM, 0) + " мм";
    } else {
      this.elements.waterLevelText.textContent = this.format(waterLevel, 1) + "%";
    }
    if (typeof oilLevelMM === 'number') {
      this.elements.oilLevelText.textContent = this.format(oilLevelMM, 0) + " мм";
    } else {
      this.elements.oilLevelText.textContent = this.format(oilLevel, 1) + "%";
    }
    this.elements.gasLevelText.textContent = this.format(gasLevel, 1) + "%";
  }
  
  /**
   * Обновление состояния клапанов
   */
  updateValveState(waterOpen, oilOpen, gasOpen) {
    this.elements.waterValve.classList.toggle('open', waterOpen);
    this.elements.oilValve.classList.toggle('open', oilOpen);
    this.elements.gasValve.classList.toggle('open', gasOpen);
    
    // Анимация потока в SVG трубах
    const waterFlows = document.querySelectorAll('.water-flow');
    const oilFlows = document.querySelectorAll('.oil-flow');
    const gasFlows = document.querySelectorAll('.gas-flow');
    
    waterFlows.forEach(flow => flow.classList.toggle('active', waterOpen));
    oilFlows.forEach(flow => flow.classList.toggle('active', oilOpen));
    gasFlows.forEach(flow => flow.classList.toggle('active', gasOpen));
    
    // Старая анимация потока в div-трубах (для совместимости)
    [this.elements.waterPipe, this.elements.waterPipe2].forEach(p => 
      p.classList.toggle('active', waterOpen)
    );
    [this.elements.oilPipe, this.elements.oilPipe2].forEach(p => 
      p.classList.toggle('active', oilOpen)
    );
    [this.elements.gasPipe, this.elements.gasPipe2].forEach(p => 
      p.classList.toggle('active', gasOpen)
    );

    // Управление потоками эмульсии: ветви для воды и нефти
    if (this.elements.emulsionWaterFlows) {
      this.elements.emulsionWaterFlows.forEach(f => f.classList.toggle('active', waterOpen));
    }
    if (this.elements.emulsionOilFlows) {
      this.elements.emulsionOilFlows.forEach(f => f.classList.toggle('active', oilOpen));
    }
  }
  
  /**
   * Обновление входного потока
   */
  updateInletFlow(flow) {
    this.elements.inletFlowText.textContent = flow + " м³/сут";

    // Показать активность эмульсионной трубы, если есть подача
    const hasFlow = Number(flow) > 0;
    this.elements.emulsionFlows.forEach(f => f.classList.toggle('active', hasFlow));

    // Включаем анимацию старой div-трубы для совместимости
    if (hasFlow) {
      this.elements.inletPipe.classList.add('active');
    } else {
      this.elements.inletPipe.classList.remove('active');
    }
  }
  
  /**
   * Анимация работы насоса
   */
  animatePump() {
    this.elements.inletPipe.classList.add('active');
    setTimeout(() => {
      this.elements.inletPipe.classList.remove('active');
    }, 1500);
  }
  
  /**
   * Показ алерта
   */
  showAlert(message) {
    this.elements.alert.textContent = message;
    this.elements.alert.style.display = "block";
    
    clearTimeout(this.alertTimer);
    this.alertTimer = setTimeout(() => {
      this.elements.alert.style.display = "none";
    }, 4000);
  }
  
  /**
   * Обновление рекомендаций
   */
  updateRecommendations(recommendation) {
    const content = this.elements.recommendationContent;
    
    // Очистка предыдущего содержимого
    content.innerHTML = '';
    
    // Статус бейдж
    const badge = document.createElement('div');
    badge.className = `status-badge ${recommendation.status}`;
    badge.textContent = recommendation.status === 'normal' ? 'НОРМА' : 
                        recommendation.status === 'warning' ? 'ВНИМАНИЕ' : 'АВАРИЯ';
    content.appendChild(badge);
    
    // Заголовок
    const title = document.createElement('h3');
    title.textContent = recommendation.title;
    content.appendChild(title);
    
    // Список рекомендаций
    const list = document.createElement('ol');
    recommendation.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
    content.appendChild(list);
    
    // Обновление стиля контейнера
    content.className = `recommendation-content ${recommendation.status}`;
  }
  
  /**
   * Настройка обработчиков табов
   */
  setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });
  }
  
  /**
   * Привязка обработчика клика
   */
  bindClick(elementId, handler) {
    const el = this.elements[elementId];
    if (el) {
      el.addEventListener('click', handler);
    }
  }
}
