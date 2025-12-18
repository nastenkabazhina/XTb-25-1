# Иконки для приложения

Поместите сюда иконки приложения:

- **icon.ico** - для Windows (256x256 px)
- **icon.icns** - для macOS
- **icon.png** - для Linux (512x512 px или 1024x1024 px)

## Создание иконок

### Онлайн сервисы:
- https://www.icoconverter.com/ - для создания .ico файлов
- https://cloudconvert.com/png-to-icns - для создания .icns файлов

### Рекомендуемые размеры:
- Windows (.ico): 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- macOS (.icns): 512x512, 1024x1024
- Linux (.png): 512x512 или 1024x1024

## Пример структуры:
```
build/
  ├── icon.ico    (Windows)
  ├── icon.icns   (macOS)
  └── icon.png    (Linux)
```

Если иконки не будут добавлены, Electron будет использовать стандартную иконку.
