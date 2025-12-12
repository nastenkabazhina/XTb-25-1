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
    this.view.bindControl('waterCv', (value) => {
      this.model.updateParameter('waterCv', value);
      this.view.updateControlValue('waterCvVal', value);
      this.updateWaterContent();
    });
    
    this.view.bindControl('waterDp', (value) => {
      this.model.updateParameter('waterDp', value);
      this.view.updateControlValue('waterDpVal', value);
      this.updateWaterContent();
    });
    
    this.view.bindControl('waterU', (value) => {
      this.model.updateParameter('waterU', value);
      this.view.updateControlValue('waterUVal', value);
      this.updateWaterContent();
      
      // Синхронизация с состоянием клапана
      const valveOpen = value > 0.1;
      if (this.model.state.waterValve !== valveOpen) {
        this.model.updateParameter('waterValve', valveOpen);
        this.updateValves();
      }
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
      this.view.updateControlValue('waterU', this.model.state.waterU);
      this.view.updateControlValue('waterUVal', this.model.state.waterU);
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
    this.checkAlerts();
  }
  
  /**
   * Обновление обводнённости
   */
  updateWaterContent() {
    const content = this.model.calculateWaterContent();
    this.view.updateWaterContent(content);
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
    this.view.updateSeparatorLevels(waterLevel, oilLevel, gasLevel);
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
    this.view.updateControlValue('waterCvVal', state.waterCv);
    this.view.updateControlValue('waterDpVal', state.waterDp);
    this.view.updateControlValue('waterUVal', state.waterU);
    this.view.updateControlValue('oilCvVal', state.oilCv);
    this.view.updateControlValue('oilDpVal', state.oilDp);
    this.view.updateControlValue('oilUVal', state.oilU);
    
    // Обновление вычисляемых значений
    this.updatePressure();
    this.updateWaterContent();
    this.updateOilLevel();
    
    // Обновление визуализации
    this.updateLevels();
    this.updateValves();
    this.view.updateInletFlow(state.inletFlow);
    
    // Обновление рекомендаций
    this.updateRecommendations();
  }
}
