# Retro Menu - Architektura Skalowalna

## Struktura projektu

```
retroMenu/
├── main.py                 # Punkt wejścia aplikacji
├── config.py              # Konfiguracja (kolory, ustawienia, stałe)
├── core/                  # Silnik gry
│   ├── __init__.py
│   ├── game.py           # Główna klasa Game
│   └── state_machine.py  # Maszyna stanów (State Machine)
├── ui/                    # Komponenty UI
│   ├── __init__.py
│   └── components.py     # Reużywalne komponenty (Menu, Panel, Title, etc.)
├── scenes/                # Sceny/Ekrany gry
│   ├── __init__.py
│   ├── base_scene.py     # Bazowa klasa dla wszystkich scen
│   └── menu_scene.py     # Scena głównego menu
└── requirements.txt
```

## Architektura

### 1. **State Machine Pattern** (Maszyna Stanów)
- Każda scena/ekran to osobny stan (`State`)
- `StateMachine` zarządza przejściami między stanami
- Łatwe dodawanie nowych ekranów

### 2. **Component-Based UI**
- Komponenty UI są niezależne i reużywalne
- `Menu`, `Panel`, `Title`, `Border` - gotowe komponenty
- Łatwe tworzenie nowych komponentów

### 3. **Separation of Concerns**
- **config.py** - wszystkie ustawienia w jednym miejscu
- **core/** - logika gry (silnik, maszyna stanów)
- **ui/** - komponenty wizualne
- **scenes/** - poszczególne ekrany aplikacji

## Jak dodawać nowe funkcje

### Dodanie nowej sceny (np. Settings)

1. Utwórz plik `scenes/settings_scene.py`:

```python
from scenes.base_scene import BaseScene

class SettingsScene(BaseScene):
    def __init__(self, state_machine):
        super().__init__(state_machine)
        # Inicjalizacja sceny
    
    def enter(self):
        # Co się dzieje przy wejściu do sceny
        pass
    
    def exit(self):
        # Co się dzieje przy wyjściu ze sceny
        pass
    
    def update(self):
        # Logika aktualizacji
        pass
    
    def draw_content(self):
        # Rysowanie zawartości sceny
        pass
```

2. Zarejestruj scenę w `main.py`:

```python
from scenes.settings_scene import SettingsScene

# W funkcji main():
game.add_scene("settings", SettingsScene(game.state_machine))
```

3. Zmień scenę (np. z menu):

```python
# W menu_scene.py, w metodzie _handle_selection():
self.state_machine.change_state("settings")
```

### Dodanie nowego komponentu UI

1. Dodaj klasę do `ui/components.py`:

```python
class Button(UIComponent):
    def __init__(self, x, y, text):
        super().__init__(x, y)
        self.text = text
        self.pressed = False
    
    def update(self):
        # Logika przycisku
        pass
    
    def draw(self):
        # Rysowanie przycisku
        pass
```

2. Użyj w scenie:

```python
from ui.components import Button

self.button = Button(50, 50, "Click me!")
```

### Modyfikacja konfiguracji

Edytuj `config.py`:
- Kolory: `COLORS`
- Rozmiar okna: `WINDOW_WIDTH`, `WINDOW_HEIGHT`
- Klawisze: `KEYS`
- Ustawienia UI: `MENU_OPTION_SPACING`, etc.

## Zalety tej architektury

1. **Skalowalność** - łatwe dodawanie nowych funkcji
2. **Czytelność** - każdy moduł ma jedną odpowiedzialność
3. **Testowalność** - komponenty można testować osobno
4. **Reużywalność** - komponenty UI można używać w wielu miejscach
5. **Utrzymywalność** - łatwe znajdowanie i modyfikowanie kodu

## Przykłady rozbudowy

### Przykład 1: Ekran Settings z opcjami

```python
# scenes/settings_scene.py
from scenes.base_scene import BaseScene
from ui.components import Menu

class SettingsScene(BaseScene):
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.menu = Menu(30, 50, ["Volume", "Controls", "Back"])
    
    def update(self):
        # Obsługa inputu i zmiany opcji
        if pyxel.btnp(pyxel.KEY_SPACE):
            if self.menu.get_selected() == "Back":
                self.state_machine.change_state("menu")
```

### Przykład 2: Ekran gry

```python
# scenes/game_scene.py
from scenes.base_scene import BaseScene

class GameScene(BaseScene):
    def __init__(self, state_machine):
        super().__init__(state_machine)
        self.show_instructions = False  # Ukryj instrukcje w grze
        self.player_x = 100
        self.player_y = 100
    
    def update(self):
        # Logika gry
        if pyxel.btn(pyxel.KEY_LEFT):
            self.player_x -= 1
        # ...
    
    def draw_content(self):
        # Rysuj grę
        pyxel.circ(self.player_x, self.player_y, 5, 10)
```

## Uruchamianie

```bash
source venv/bin/activate
python main.py
```


