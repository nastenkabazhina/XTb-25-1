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
      // Контролы регулятора давления
      kvs: document.getElementById('kvs'),
      flow: document.getElementById('flow'),
      kvsVal: document.getElementById('kvsVal'),
      flowVal: document.getElementById('flowVal'),
      pressureOut: document.getElementById('pressureOut'),
      
      // Контролы регулятора воды
      waterK: document.getElementById('waterK'),
      waterQ: document.getElementById('waterQ'),
      waterKVal: document.getElementById('waterKVal'),
      waterQVal: document.getElementById('waterQVal'),
      waterLevel: document.getElementById('waterLevel'),
      
      // Контролы регулятора нефти
      oilCv: document.getElementById('oilCv'),
      oilDp: document.getElementById('oilDp'),
      oilU: document.getElementById('oilU'),
      oilCvVal: document.getElementById('oilCvVal'),
      oilDpVal: document.getElementById('oilDpVal'),
      oilUVal: document.getElementById('oilUVal'),
      oilQ: document.getElementById('oilQ'),
      
      // Визуализация
      gaugePressure: document.getElementById('gaugePressure'),
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
      
      // Насос
      pump: document.getElementById('pump'),
      
      // Алерты и рекомендации
      alert: document.getElementById('alertBox'),
      recommendationContent: document.getElementById('recommendationContent')
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
    const formatted = this.format(pressure, 0);
    this.elements.pressureOut.textContent = formatted + " кПа";
    this.elements.gaugePressure.textContent = formatted;
  }
  
  /**
   * Обновление уровня воды (в миллиметрах)
   */
  updateWaterLevelMM(levelMM) {
    const formatted = this.format(levelMM, 0);
    this.elements.waterLevel.textContent = formatted + " мм";
    
    // Изменение цвета в зависимости от критичности
    if (levelMM > 2880 || levelMM < 320) {
      this.elements.waterLevel.style.color = '#ff4d4f';
    } else if (levelMM > 2500 || levelMM < 500) {
      this.elements.waterLevel.style.color = '#ffa940';
    } else {
      this.elements.waterLevel.style.color = '#4fa3ff';
    }
  }
  
  /**
   * Обновление уровня нефти
   */
  updateOilLevel(level) {
    this.elements.oilQ.textContent = this.format(level, 2) + " %";
  }
  
  /**
   * Обновление визуализации уровней в сепараторе
   */
  updateSeparatorLevels(waterLevel, oilLevel, gasLevel) {
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
    
    this.elements.waterLevelText.textContent = this.format(waterLevel, 1) + "%";
    this.elements.oilLevelText.textContent = this.format(oilLevel, 1) + "%";
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
  }
  
  /**
   * Обновление входного потока
   */
  updateInletFlow(flow) {
    this.elements.inletFlowText.textContent = flow + " м³/сут";
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
   * Скрытие алерта
   */
  hideAlert() {
    this.elements.alert.style.display = "none";
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
   * Привязка обработчика к контролу
   */
  bindControl(elementId, handler) {
    const el = this.elements[elementId];
    if (el) {
      el.addEventListener('input', (e) => handler(Number(e.target.value)));
    }
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
