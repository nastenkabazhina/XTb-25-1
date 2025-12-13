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
                  });
                  oilLevelSlider.dispatchEvent(new Event('input'));
                }
            // Удаляем обработку ползунка для вкладки нефти, так как вкладка удалена
            // Можно добавить очистку или отключение событий, если это необходимо
        // Удаляем обработку ползунка для вкладки воды, так как вкладка удалена
        // Можно добавить очистку или отключение событий, если это необходимо
    
        // Удаляем обработку ползунка для вкладки воды
        const waterSlider = document.getElementById('waterK');
        if (waterSlider) {
          waterSlider.replaceWith(waterSlider.cloneNode(true));
        }
        const waterQSlider = document.getElementById('waterQ');
        if (waterQSlider) {
          waterQSlider.replaceWith(waterQSlider.cloneNode(true));
        }
    // Регулятор давления
    this.view.bindControl('kvs', (value) => {
      this.model.updateParameter('kvs', value);
      this.view.updateControlValue('kvsVal', value);
      this.updatePressure();
    });
    
    this.view.bindControl('flow', (value) => {
      this.model.updateParameter('flow', value);
      this.view.updateControlValue('flowVal', value);
      this.updatePressure();
    });
    
    // Регулятор воды
    this.view.bindControl('waterK', (value) => {
      this.model.updateParameter('waterK', value);
      this.view.updateControlValue('waterKVal', value);
      this.updateWaterLevelMM();
      
      // Синхронизация с состоянием клапана
      const valveOpen = value > 0.1;
      if (this.model.state.waterValve !== valveOpen) {
        this.model.updateParameter('waterValve', valveOpen);
        this.updateValves();
      }
    });
    
    this.view.bindControl('waterQ', (value) => {
      this.model.updateParameter('waterQ', value);
      this.view.updateControlValue('waterQVal', value);
      this.updateWaterLevelMM();
    });
    
    // Регулятор нефти
    this.view.bindControl('oilCv', (value) => {
      this.model.updateParameter('oilCv', value);
      this.view.updateControlValue('oilCvVal', value);
      this.updateOilLevel();
    });
    
    this.view.bindControl('oilDp', (value) => {
      this.model.updateParameter('oilDp', value);
      this.view.updateControlValue('oilDpVal', value);
      this.updateOilLevel();
    });
    
    this.view.bindControl('oilU', (value) => {
      this.model.updateParameter('oilU', value);
      this.view.updateControlValue('oilUVal', value);
      this.updateOilLevel();
      
      // Синхронизация с состоянием клапана
      const valveOpen = value > 0.1;
      if (this.model.state.oilValve !== valveOpen) {
        this.model.updateParameter('oilValve', valveOpen);
        this.updateValves();
      }
    });
    
    // Клапаны
    this.view.bindClick('waterValve', () => {
      this.model.toggleValve('water');
      this.updateValves();
      this.view.updateControlValue('waterK', this.model.state.waterK);
      this.view.updateControlValue('waterKVal', this.model.state.waterK);
    });
    
    this.view.bindClick('oilValve', () => {
      this.model.toggleValve('oil');
      this.updateValves();
      this.view.updateControlValue('oilU', this.model.state.oilU);
      this.view.updateControlValue('oilUVal', this.model.state.oilU);
    });
    
    this.view.bindClick('gasValve', () => {
      this.model.toggleValve('gas');
      this.updateValves();
    });
    
    // Насос
    this.view.bindClick('pump', () => {
      const newFlow = this.model.increasePumpFlow();
      this.view.updateInletFlow(newFlow);
      this.view.updateControlValue('flow', newFlow);
      this.view.updateControlValue('flowVal', newFlow);
      this.view.animatePump();
      this.view.showAlert(`Насос увеличил подачу: ${newFlow} м³/сут`);
      this.updatePressure();
    });
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
    this.view.updateControlValue('pressureMPa', pressure.toFixed(2));
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
    
    // Обновление контролов
    this.view.updateControlValue('kvsVal', state.kvs);
    this.view.updateControlValue('flowVal', state.flow);
    this.view.updateControlValue('waterKVal', state.waterK);
    this.view.updateControlValue('waterQVal', state.waterQ);
    this.view.updateControlValue('oilCvVal', state.oilCv);
    this.view.updateControlValue('oilDpVal', state.oilDp);
    this.view.updateControlValue('oilUVal', state.oilU);
    
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
