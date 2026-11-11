// Snapshot generated from editor.html original() on 2026-11-11.
// Showroom defaults must not depend on a viewer's localStorage.
// Re-generate this checked-in snapshot if the approved house architecture changes.
export const APPROVED_HOUSE_V1={
  "format": "adkh-house-project",
  "formatVersion": 1,
  "model": {
    "version": 1,
    "title": "Мой дом",
    "height": 3.74,
    "elevation": 0.6,
    "walls": [
      {
        "id": "front",
        "type": "wall",
        "name": "Фасад во двор",
        "x1": 0,
        "z1": 5.5,
        "x2": 19.03,
        "z2": 5.5,
        "t": 0.4
      },
      {
        "id": "back",
        "type": "wall",
        "name": "Задний фасад",
        "x1": 0,
        "z1": -5.5,
        "x2": 19.03,
        "z2": -5.5,
        "t": 0.4
      },
      {
        "id": "west",
        "type": "wall",
        "name": "Левый фасад",
        "x1": 0,
        "z1": -5.5,
        "x2": 0,
        "z2": 5.5,
        "t": 0.4
      },
      {
        "id": "east",
        "type": "wall",
        "name": "Правый фасад",
        "x1": 19.03,
        "z1": -5.5,
        "x2": 19.03,
        "z2": 5.5,
        "t": 0.4
      },
      {
        "id": "livingBack",
        "type": "wall",
        "name": "Перегородка зала",
        "x1": 0.4,
        "z1": -0.9,
        "x2": 9.6,
        "z2": -0.9,
        "t": 0.4
      },
      {
        "id": "livingHall",
        "type": "wall",
        "name": "Зал / коридор",
        "x1": 9.6,
        "z1": -0.9,
        "x2": 9.6,
        "z2": 5.5,
        "t": 0.4
      },
      {
        "id": "kitchenHall",
        "type": "wall",
        "name": "Кухня / коридор",
        "x1": 13.52,
        "z1": -0.9,
        "x2": 13.52,
        "z2": 5.5,
        "t": 0.4
      },
      {
        "id": "kitchenBack",
        "type": "wall",
        "name": "Перегородка кухни",
        "x1": 13.52,
        "z1": -0.9,
        "x2": 19.03,
        "z2": -0.9,
        "t": 0.4
      },
      {
        "id": "stairRight",
        "type": "wall",
        "name": "Лестница / гардеробная",
        "x1": 13.595,
        "z1": -5.5,
        "x2": 13.595,
        "z2": -0.9,
        "t": 0.25
      },
      {
        "id": "stairLeft",
        "type": "wall",
        "name": "Лестница / спальня",
        "x1": 9.525,
        "z1": -5.5,
        "x2": 9.525,
        "z2": -0.9,
        "t": 0.25
      },
      {
        "id": "bedroomRight",
        "type": "wall",
        "name": "Спальня / ванная",
        "x1": 5.725,
        "z1": -5.5,
        "x2": 5.725,
        "z2": -1,
        "t": 0.25
      },
      {
        "id": "bathFront",
        "type": "wall",
        "name": "Ванная / проход",
        "x1": 5.725,
        "z1": -2.675,
        "x2": 9.525,
        "z2": -2.675,
        "t": 0.25
      },
      {
        "id": "bedFront",
        "type": "wall",
        "name": "Спальня / зал",
        "x1": 0.4,
        "z1": -1,
        "x2": 9.525,
        "z2": -1,
        "t": 0.25
      }
    ],
    "openings": [
      {
        "id": "livingW1",
        "type": "window",
        "name": "Зал · окно 1",
        "wall": "front",
        "offset": 3.2,
        "width": 2.3,
        "sill": 0.28,
        "head": 3.19,
        "leaves": 1
      },
      {
        "id": "livingW2",
        "type": "window",
        "name": "Зал · окно 2",
        "wall": "front",
        "offset": 6.6,
        "width": 2.3,
        "sill": 0.28,
        "head": 3.19,
        "leaves": 1
      },
      {
        "id": "kitchenW",
        "type": "window",
        "name": "Кухня · окно 3 м",
        "wall": "front",
        "offset": 16.2,
        "width": 3,
        "sill": 0.28,
        "head": 3.19,
        "leaves": 1
      },
      {
        "id": "frontEntry",
        "type": "door",
        "name": "Главный вход",
        "wall": "front",
        "offset": 11.55,
        "width": 2.3,
        "sill": 0,
        "head": 2.55,
        "leaves": 2
      },
      {
        "id": "stairWindow",
        "type": "window",
        "name": "Окно лестницы",
        "wall": "back",
        "offset": 11.35,
        "width": 1.65,
        "sill": 1.82,
        "head": 3.52,
        "leaves": 1
      },
      {
        "id": "bedWindow",
        "type": "window",
        "name": "Спальня · слева",
        "wall": "west",
        "offset": 2.3,
        "width": 1.65,
        "sill": 0.83,
        "head": 2.4,
        "leaves": 1
      },
      {
        "id": "livingD",
        "type": "door",
        "name": "Дверь зала 70+70",
        "wall": "livingHall",
        "offset": 2.9,
        "width": 1.4,
        "sill": 0,
        "head": 2.2,
        "leaves": 2
      },
      {
        "id": "kitchenD",
        "type": "door",
        "name": "Дверь кухни 70+70",
        "wall": "kitchenHall",
        "offset": 2.2,
        "width": 1.4,
        "sill": 0,
        "head": 2.2,
        "leaves": 2
      },
      {
        "id": "wardrobeD",
        "type": "door",
        "name": "Дверь кладовой",
        "wall": "stairRight",
        "offset": 3.14,
        "width": 1.12,
        "sill": 0,
        "head": 2.2,
        "leaves": 1
      },
      {
        "id": "stairArch",
        "type": "passage",
        "name": "Открытый проход в спальню",
        "wall": "stairLeft",
        "offset": 3.43,
        "width": 0.95,
        "sill": 0,
        "head": 2.99,
        "leaves": 1
      },
      {
        "id": "bedD",
        "type": "door",
        "name": "Дверь спальни",
        "wall": "bedroomRight",
        "offset": 3.43,
        "width": 0.95,
        "sill": 0,
        "head": 2.2,
        "leaves": 1
      },
      {
        "id": "bathD",
        "type": "door",
        "name": "Дверь ванной",
        "wall": "bathFront",
        "offset": 1.575,
        "width": 1,
        "sill": 0,
        "head": 2.2,
        "leaves": 1
      }
    ],
    "rooms": [
      {
        "id": "living",
        "name": "Зал",
        "x": 0.4,
        "z": -0.65,
        "w": 9,
        "h": 5.95,
        "wall": "#e9e2d8",
        "floor": "#c4b098"
      },
      {
        "id": "kitchen",
        "name": "Кухня",
        "x": 13.8,
        "z": -0.65,
        "w": 4.9,
        "h": 5.9,
        "wall": "#ebe2d8",
        "floor": "#ddd5c9"
      },
      {
        "id": "hall",
        "name": "Коридор",
        "x": 9.8,
        "z": -0.8,
        "w": 3.5,
        "h": 6,
        "wall": "#eee9df",
        "floor": "#dad1c5"
      },
      {
        "id": "stair",
        "name": "Лестница",
        "x": 9.8,
        "z": -5.3,
        "w": 3.5,
        "h": 4.15,
        "wall": "#ebe5dc",
        "floor": "#c9c0b5"
      },
      {
        "id": "bed",
        "name": "Спальня",
        "x": 0.4,
        "z": -5.3,
        "w": 5.2,
        "h": 4.1,
        "wall": "#e9e4db",
        "floor": "#c4aa91"
      },
      {
        "id": "bath",
        "name": "Ванная",
        "x": 5.9,
        "z": -5.3,
        "w": 3.4,
        "h": 2.5,
        "wall": "#ded8d1",
        "floor": "#d6d1cb"
      },
      {
        "id": "ward",
        "name": "Гардеробная",
        "x": 13.8,
        "z": -5.3,
        "w": 4.9,
        "h": 4.1,
        "wall": "#e5ded4",
        "floor": "#bfae99"
      }
    ],
    "furniture": [
      {
        "id": "f1",
        "type": "sofa",
        "name": "Диван",
        "x": 4.6,
        "z": 1.5,
        "w": 3.2,
        "d": 1.05,
        "h": 0.85,
        "rot": 0,
        "color": "#d6c9b9"
      },
      {
        "id": "f2",
        "type": "table",
        "name": "Журнальный стол",
        "x": 4.6,
        "z": 3,
        "w": 1.4,
        "d": 0.8,
        "h": 0.48,
        "rot": 0,
        "color": "#9a806a"
      },
      {
        "id": "f3",
        "type": "bed",
        "name": "Кровать",
        "x": 2.6,
        "z": -3.4,
        "w": 2.1,
        "d": 2,
        "h": 0.65,
        "rot": 0,
        "color": "#bca791"
      },
      {
        "id": "f4",
        "type": "cabinet",
        "name": "Шкаф кухни",
        "x": 17,
        "z": -0.15,
        "w": 2.8,
        "d": 0.6,
        "h": 2.15,
        "rot": 0,
        "color": "#d6c6b7"
      },
      {
        "id": "f5",
        "type": "table",
        "name": "Обеденный стол",
        "x": 16,
        "z": 2.8,
        "w": 1.9,
        "d": 0.9,
        "h": 0.75,
        "rot": 0,
        "color": "#b9a48c"
      }
    ],
    "stairs": [
      {
        "id": "stair1",
        "type": "stair",
        "name": "П-образная лестница · два поворота",
        "x": 12.9,
        "z": -1.11,
        "width": 1.05,
        "lower": 1.23,
        "upper": 1.65,
        "returnRun": 2.635,
        "back": -4.755,
        "rot": 0,
        "color": "#ded8cf"
      }
    ]
  }
};
