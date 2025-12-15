/**
 * Controller - Application Logic Layer
 * Связывает модель и представление, управляет потоком данных
 */

class SeparatorController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    
    this.init();
  }
  
  /**
   * Инициализация приложения
   */
  init() {
    // Настройка табов
    this.view.setupTabs();
    
    // Привязка обработчиков контролов
    this.bindControls();
    
    // Подписка на изменения модели
    this.model.subscribe((state) => this.onStateChange(state));
    
    // Начальное обновление UI
    this.updateUI();
    
    // Запуск симуляции
    setInterval(() => this.tick(), 900);
  }
  
  /**
   * Привязка обработчиков контролов
   */
  bindControls() {
    // Обновление показателя расхода на входе при инициализации и изменениях
    const updateInletFlowText = () => {
      const inletFlow = this.model.state.inletFlow || 5000; // по умолчанию 5000
      const inletFlowText = document.getElementById('inletFlowText');
      if (inletFlowText) {
        inletFlowText.textContent = inletFlow + ' м³/сут';
      }
    };
    updateInletFlowText();
    this.model.subscribe(() => updateInletFlowText());
    
    // Клапан регулятора давления (газ)
    const gasSlider = document.getElementById('gas');
    const gasValDisplay = document.getElementById('gasVal');
    const pressureValDisplay = document.getElementById('pressureVal');
    
    if (gasSlider && gasValDisplay) {
      gasSlider.addEventListener('input', () => {
        const gasValue = parseFloat(gasSlider.value);
        gasValDisplay.textContent = gasValue.toFixed(2);
        
        // Обновляем модель
        this.model.updateParameter('gas', gasValue);
        
        // Рассчитываем давление (пример формулы)
        const pressure = 2.5 * gasValue; // Простая линейная зависимость
        if (pressureValDisplay) {
          pressureValDisplay.textContent = pressure.toFixed(2);
          // Обновляем левый нижний индикатор давления
          const leftBottomPressure = document.getElementById('pressureMPa');
          if (leftBottomPressure) {
            leftBottomPressure.textContent = pressure.toFixed(3) + ' МПа';
          }
        }
        
        // Обновляем состояние клапана
        const valveOpen = gasValue > 0.1;
        if (this.model.state.gasValve !== valveOpen) {
          this.model.updateParameter('gasValve', valveOpen);
          this.updateValves();
        }
      });
      gasSlider.dispatchEvent(new Event('input'));
    }
    
    // Клапан регулятора уровня воды в основной камере
    const waterLevelSlider = document.getElementById('waterLevelK');
    const waterLevelValDisplay = document.getElementById('waterLevelKVal');
    const waterLevelOutput = document.getElementById('waterLevelVal');
    
    if (waterLevelSlider && waterLevelValDisplay && waterLevelOutput) {
      waterLevelSlider.addEventListener('input', () => {
        const k = parseFloat(waterLevelSlider.value);
        waterLevelValDisplay.textContent = k.toFixed(2);
        
        // Формула: 1112 минус 792 * кубический корень из ((k - 0.1) / 1.4625)
        let waterVal = 1112;
        if (k > 0.1) {
          waterVal -= 792 * Math.cbrt((k - 0.1) / 1.4625);
        }
        waterLevelOutput.textContent = waterVal.toFixed(3);
        
        // Обновляем модель
        this.model.updateParameter('waterLevelK', k);
        this.model.updateParameter('waterLevelMM', waterVal);
        
        // Обновляем состояние клапана
        const valveOpen = k > 0.1;
        if (this.model.state.waterValve !== valveOpen) {
          this.model.updateParameter('waterValve', valveOpen);
          this.updateValves();
        }
        // Обновляем левый нижний индикатор воды
        const leftBottomWater = document.getElementById('waterLevelText');
        if (leftBottomWater) {
          leftBottomWater.textContent = waterVal.toFixed(3) + ' мм';
        }
      });
      waterLevelSlider.dispatchEvent(new Event('input'));
    }
    
    // Клапан регулятора уровня нефти в основной камере
    const oilLevelSlider = document.getElementById('oilLevelK');
    const oilLevelValDisplay = document.getElementById('oilLevelKVal');
    const oilLevelOutput = document.getElementById('oilLevelVal');
    
    if (oilLevelSlider && oilLevelValDisplay && oilLevelOutput) {
      oilLevelSlider.addEventListener('input', () => {
        const k = parseFloat(oilLevelSlider.value);
        oilLevelValDisplay.textContent = k.toFixed(2);
        
        // Формула: 973 минус 473 * кубический корень из ((k - 0.1) / 1.4625)
        let oilVal = 973;
        if (k > 0.1) {
          oilVal -= 473 * Math.cbrt((k - 0.1) / 1.4625);
        }
        oilLevelOutput.textContent = oilVal.toFixed(3);
        
        // Обновляем модель
        this.model.updateParameter('oilLevelK', k);
        this.model.updateParameter('oilLevelMM', oilVal);
        
        // Обновляем состояние клапана
        const valveOpen = k > 0.1;
        if (this.model.state.oilValve !== valveOpen) {
          this.model.updateParameter('oilValve', valveOpen);
          this.updateValves();
        }
      });
      oilLevelSlider.dispatchEvent(new Event('input'));
    }
    
    // Клапаны
    this.view.bindClick('waterValve', () => {
      this.model.toggleValve('water');
      this.updateValves();
    });
    
    this.view.bindClick('oilValve', () => {
      this.model.toggleValve('oil');
      this.updateValves();
    });
    
    this.view.bindClick('gasValve', () => {
      this.model.toggleValve('gas');
      this.updateValves();
    });
    
    // Насос (если элемент существует)
    const pumpElement = document.getElementById('pump');
    if (pumpElement) {
      this.view.bindClick('pump', () => {
        const newFlow = this.model.increasePumpFlow();
        this.view.updateInletFlow(newFlow);
        this.view.animatePump();
        this.view.showAlert(`Насос увеличил подачу: ${newFlow} м³/сут`);
        this.updatePressure();
      });
    }
  }
  
  /**
   * Обработчик изменения состояния модели
   */
  onStateChange(state) {
    // Обновление рекомендаций при изменении ключевых параметров
    this.updateRecommendations();
  }
  
  /**
   * Обновление давления
   */
  updatePressure() {
    const pressure = this.model.calculatePressure();
    this.view.updatePressure(pressure);
    // Обновляем левый нижний индикатор давления
    const leftBottomPressure = document.getElementById('pressureMPa');
    if (leftBottomPressure) {
      leftBottomPressure.textContent = pressure.toFixed(3) + ' МПа';
    }
    
    this.checkAlerts();
  }
  
  /**
   * Обновление уровня воды (в миллиметрах)
   */
  updateWaterLevelMM() {
    const levelMM = this.model.calculateWaterLevelMM();
    this.view.updateWaterLevelMM(levelMM);
    this.checkAlerts();
  }
  
  /**
   * Обновление уровня нефти
   */
  updateOilLevel() {
    const level = this.model.calculateOilLevel();
    this.view.updateOilLevel(level);
    this.checkAlerts();
  }
  
  /**
   * Обновление состояния клапанов
   */
  updateValves() {
    const { waterValve, oilValve, gasValve } = this.model.state;
    this.view.updateValveState(waterValve, oilValve, gasValve);
  }
  
  /**
   * Обновление уровней в сепараторе
   */
  updateLevels() {
    const { waterLevel, oilLevel, gasLevel } = this.model.state;
    // Получаем миллиметры уровней
    const waterLevelMM = this.model.calculateWaterLevelMM();
    const oilLevelMM = this.model.calculateOilLevelMM();
    this.view.updateSeparatorLevels(waterLevel, oilLevel, gasLevel, waterLevelMM, oilLevelMM);
  }
  
  /**
   * Обновление рекомендаций
   */
  updateRecommendations() {
    const recommendation = this.model.getRecommendations();
    this.view.updateRecommendations(recommendation);
  }
  
  /**
   * Проверка аварийных состояний
   */
  checkAlerts() {
    const alerts = this.model.checkAlerts();
    
    if (alerts.length > 0) {
      // Показываем самый критичный алерт
      const criticalAlert = alerts.find(a => a.type === 'critical') || alerts[0];
      this.view.showAlert(criticalAlert.message);
    }
  }
  
  /**
   * Тик симуляции
   */
  tick() {
    this.model.simulate();
    this.updateLevels();
    this.checkAlerts();
    this.updateRecommendations();
  }
  
  /**
   * Полное обновление UI
   */
  updateUI() {
    const state = this.model.state;
    
    // Обновление вычисляемых значений
    this.updatePressure();
    this.updateWaterLevelMM();
    this.updateOilLevel();
    
    // Обновление визуализации
    this.updateLevels();
    this.updateValves();
    this.view.updateInletFlow(state.inletFlow);
    
    // Обновление рекомендаций
    this.updateRecommendations();
  }
}
