export type FragmentSeed = {
  id: number;
  slug: string;
  piece: number;
  title: string;
  image: string;
  owner: string;
  rarity: string;
  listed: boolean;
  price: number;
};

export const fragments: FragmentSeed[] = [
  // Puzzle 1: Симпатичный щенок - missing pieces 1, 2
  {
    id: 1,
    slug: "sympatichnyy-shchenok-fragment-1",
    piece: 1,
    title: "Симпатичный щенок - Фрагмент 1",
    image: "/photo_2026-06-26_21-05-59.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  {
    id: 2,
    slug: "sympatichnyy-shchenok-fragment-2",
    piece: 2,
    title: "Симпатичный щенок - Фрагмент 2",
    image: "/photo_2026-06-26_21-05-59.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  // Puzzle 2: Милый котенок - missing pieces 1, 2, 3
  {
    id: 3,
    slug: "milyy-kotenok-fragment-1",
    piece: 1,
    title: "Милый котенок - Фрагмент 1",
    image: "/photo_2026-06-26_21-06-19.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  {
    id: 4,
    slug: "milyy-kotenok-fragment-2",
    piece: 2,
    title: "Милый котенок - Фрагмент 2",
    image: "/photo_2026-06-26_21-06-19.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  {
    id: 5,
    slug: "milyy-kotenok-fragment-3",
    piece: 3,
    title: "Милый котенок - Фрагмент 3",
    image: "/photo_2026-06-26_21-06-19.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  // Puzzle 3: Золотистый ретривер - missing pieces 1, 2
  {
    id: 6,
    slug: "zolotistyy-retriver-fragment-1",
    piece: 1,
    title: "Золотистый ретривер - Фрагмент 1",
    image: "/photo_2026-06-26_21-06-39.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 60
  },
  {
    id: 7,
    slug: "zolotistyy-retriver-fragment-2",
    piece: 2,
    title: "Золотистый ретривер - Фрагмент 2",
    image: "/photo_2026-06-26_21-06-39.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 60
  },
  // Puzzle 4: Игривая собачка - missing piece 1
  {
    id: 8,
    slug: "igrivaya-sobachka-fragment-1",
    piece: 1,
    title: "Игривая собачка - Фрагмент 1",
    image: "/photo_2026-06-26_21-06-44.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 43
  },
  // Puzzle 5: Лабрадор на природе - missing pieces 1, 2, 3
  {
    id: 9,
    slug: "labrador-na-prirode-fragment-1",
    piece: 1,
    title: "Лабрадор на природе - Фрагмент 1",
    image: "/photo_2026-06-26_21-06-48.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  {
    id: 10,
    slug: "labrador-na-prirode-fragment-2",
    piece: 2,
    title: "Лабрадор на природе - Фрагмент 2",
    image: "/photo_2026-06-26_21-06-48.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  {
    id: 11,
    slug: "labrador-na-prirode-fragment-3",
    piece: 3,
    title: "Лабрадор на природе - Фрагмент 3",
    image: "/photo_2026-06-26_21-06-48.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  // Puzzle 6: Щенок в траве - missing pieces 1, 2
  {
    id: 12,
    slug: "shchenok-v-trave-fragment-1",
    piece: 1,
    title: "Щенок в траве - Фрагмент 1",
    image: "/photo_2026-06-26_21-06-53.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 50
  },
  {
    id: 13,
    slug: "shchenok-v-trave-fragment-2",
    piece: 2,
    title: "Щенок в траве - Фрагмент 2",
    image: "/photo_2026-06-26_21-06-53.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 50
  },
  // Puzzle 7: Корги в саду - missing pieces 1, 2, 3
  {
    id: 14,
    slug: "korgi-v-sadu-fragment-1",
    piece: 1,
    title: "Корги в саду - Фрагмент 1",
    image: "/photo_2026-06-26_21-07-01.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 68
  },
  {
    id: 15,
    slug: "korgi-v-sadu-fragment-2",
    piece: 2,
    title: "Корги в саду - Фрагмент 2",
    image: "/photo_2026-06-26_21-07-01.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 68
  },
  {
    id: 16,
    slug: "korgi-v-sadu-fragment-3",
    piece: 3,
    title: "Корги в саду - Фрагмент 3",
    image: "/photo_2026-06-26_21-07-01.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 68
  },
  // Puzzle 8: Два щенка - missing pieces 1, 2
  {
    id: 17,
    slug: "dva-shchenka-fragment-1",
    piece: 1,
    title: "Два щенка - Фрагмент 1",
    image: "/photo_2026-06-26_21-07-07.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 73
  },
  {
    id: 18,
    slug: "dva-shchenka-fragment-2",
    piece: 2,
    title: "Два щенка - Фрагмент 2",
    image: "/photo_2026-06-26_21-07-07.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 73
  },
  // Puzzle 9: Маленький пёсик - missing piece 1
  {
    id: 19,
    slug: "malenkiy-pesik-fragment-1",
    piece: 1,
    title: "Маленький пёсик - Фрагмент 1",
    image: "/photo_2026-06-26_21-07-14.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 40
  },
  // Puzzle 10: Щенок с игрушкой - missing pieces 1, 2, 3
  {
    id: 20,
    slug: "shchenok-s-igrushkoy-fragment-1",
    piece: 1,
    title: "Щенок с игрушкой - Фрагмент 1",
    image: "/photo_2026-06-26_21-07-18.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 58
  },
  {
    id: 21,
    slug: "shchenok-s-igrushkoy-fragment-2",
    piece: 2,
    title: "Щенок с игрушкой - Фрагмент 2",
    image: "/photo_2026-06-26_21-07-18.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 58
  },
  {
    id: 22,
    slug: "shchenok-s-igrushkoy-fragment-3",
    piece: 3,
    title: "Щенок с игрушкой - Фрагмент 3",
    image: "/photo_2026-06-26_21-07-18.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 58
  },
  // Puzzle 11: Счастливый щенок - missing pieces 1, 2
  {
    id: 23,
    slug: "schastlivyy-shchenok-fragment-1",
    piece: 1,
    title: "Счастливый щенок - Фрагмент 1",
    image: "/photo_2026-06-26_21-07-22.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 53
  },
  {
    id: 24,
    slug: "schastlivyy-shchenok-fragment-2",
    piece: 2,
    title: "Счастливый щенок - Фрагмент 2",
    image: "/photo_2026-06-26_21-07-22.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 53
  },
  // Puzzle 12: Щенок на лужайке - missing piece 1
  {
    id: 25,
    slug: "shchenok-na-luzhayke-fragment-1",
    piece: 1,
    title: "Щенок на лужайке - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-31.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 49
  },
  // Puzzle 13: Маленький йорк - missing pieces 1, 2, 3
  {
    id: 26,
    slug: "malenkiy-york-fragment-1",
    piece: 1,
    title: "Маленький йорк - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-37.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  {
    id: 27,
    slug: "malenkiy-york-fragment-2",
    piece: 2,
    title: "Маленький йорк - Фрагмент 2",
    image: "/photo_2026-06-26_21-10-37.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  {
    id: 28,
    slug: "malenkiy-york-fragment-3",
    piece: 3,
    title: "Маленький йорк - Фрагмент 3",
    image: "/photo_2026-06-26_21-10-37.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  // Puzzle 14: Щенок в движении - missing pieces 1, 2
  {
    id: 29,
    slug: "shchenok-v-dvizhenii-fragment-1",
    piece: 1,
    title: "Щенок в движении - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-42.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 38
  },
  {
    id: 30,
    slug: "shchenok-v-dvizhenii-fragment-2",
    piece: 2,
    title: "Щенок в движении - Фрагмент 2",
    image: "/photo_2026-06-26_21-10-42.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 38
  },
  // Puzzle 15: Игривый щенок - missing piece 1
  {
    id: 31,
    slug: "igrivyy-shchenok-fragment-1",
    piece: 1,
    title: "Игривый щенок - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-46.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 41
  },
  // Puzzle 16: Щенок с цветами - missing pieces 1, 2, 3
  {
    id: 32,
    slug: "shchenok-s-tsvetami-fragment-1",
    piece: 1,
    title: "Щенок с цветами - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-50.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  {
    id: 33,
    slug: "shchenok-s-tsvetami-fragment-2",
    piece: 2,
    title: "Щенок с цветами - Фрагмент 2",
    image: "/photo_2026-06-26_21-10-50.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  {
    id: 34,
    slug: "shchenok-s-tsvetami-fragment-3",
    piece: 3,
    title: "Щенок с цветами - Фрагмент 3",
    image: "/photo_2026-06-26_21-10-50.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  // Puzzle 17: Милый пёсик - missing pieces 1, 2
  {
    id: 35,
    slug: "milyy-pesik-fragment-1",
    piece: 1,
    title: "Милый пёсик - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-53.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 44
  },
  {
    id: 36,
    slug: "milyy-pesik-fragment-2",
    piece: 2,
    title: "Милый пёсик - Фрагмент 2",
    image: "/photo_2026-06-26_21-10-53.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 44
  },
  // Puzzle 18: Щенок в поле - missing piece 1
  {
    id: 37,
    slug: "shchenok-v-pole-fragment-1",
    piece: 1,
    title: "Щенок в поле - Фрагмент 1",
    image: "/photo_2026-06-26_21-10-57.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 46
  },
  // Puzzle 19: Щенок с листом - missing pieces 1, 2, 3
  {
    id: 38,
    slug: "shchenok-s-listom-fragment-1",
    piece: 1,
    title: "Щенок с листом - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-01.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 43
  },
  {
    id: 39,
    slug: "shchenok-s-listom-fragment-2",
    piece: 2,
    title: "Щенок с листом - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-01.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 43
  },
  {
    id: 40,
    slug: "shchenok-s-listom-fragment-3",
    piece: 3,
    title: "Щенок с листом - Фрагмент 3",
    image: "/photo_2026-06-26_21-11-01.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 43
  },
  // Puzzle 20: Щенок на прогулке - missing pieces 1, 2
  {
    id: 41,
    slug: "shchenok-na-progulke-fragment-1",
    piece: 1,
    title: "Щенок на прогулке - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-05.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 50
  },
  {
    id: 42,
    slug: "shchenok-na-progulke-fragment-2",
    piece: 2,
    title: "Щенок на прогулке - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-05.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 50
  },
  // Puzzle 21: Щенок с мячом - missing piece 1
  {
    id: 43,
    slug: "shchenok-s-mjachom-fragment-1",
    piece: 1,
    title: "Щенок с мячом - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-09.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 53
  },
  // Puzzle 22: Щенок в лесу - missing pieces 1, 2, 3
  {
    id: 44,
    slug: "shchenok-v-lesu-fragment-1",
    piece: 1,
    title: "Щенок в лесу - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-13.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  {
    id: 45,
    slug: "shchenok-v-lesu-fragment-2",
    piece: 2,
    title: "Щенок в лесу - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-13.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  {
    id: 46,
    slug: "shchenok-v-lesu-fragment-3",
    piece: 3,
    title: "Щенок в лесу - Фрагмент 3",
    image: "/photo_2026-06-26_21-11-13.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 55
  },
  // Puzzle 23: Щенок с бабочкой - missing pieces 1, 2
  {
    id: 47,
    slug: "shchenok-s-babochkoy-fragment-1",
    piece: 1,
    title: "Щенок с бабочкой - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-16.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 63
  },
  {
    id: 48,
    slug: "shchenok-s-babochkoy-fragment-2",
    piece: 2,
    title: "Щенок с бабочкой - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-16.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 63
  },
  // Puzzle 24: Щенок с цветами - missing piece 1
  {
    id: 49,
    slug: "shchenok-s-tsvetami-2-fragment-1",
    piece: 1,
    title: "Щенок с цветами - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-24.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 83
  },
  // Puzzle 25: Щенок на закате - missing pieces 1, 2, 3
  {
    id: 50,
    slug: "shchenok-na-zakate-fragment-1",
    piece: 1,
    title: "Щенок на закате - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-28.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 78
  },
  {
    id: 51,
    slug: "shchenok-na-zakate-fragment-2",
    piece: 2,
    title: "Щенок на закате - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-28.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 78
  },
  {
    id: 52,
    slug: "shchenok-na-zakate-fragment-3",
    piece: 3,
    title: "Щенок на закате - Фрагмент 3",
    image: "/photo_2026-06-26_21-11-28.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 78
  },
  // Puzzle 26: Щенок в саду - missing pieces 1, 2
  {
    id: 53,
    slug: "shchenok-v-sadu-fragment-1",
    piece: 1,
    title: "Щенок в саду - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-31.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 73
  },
  {
    id: 54,
    slug: "shchenok-v-sadu-fragment-2",
    piece: 2,
    title: "Щенок в саду - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-31.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 73
  },
  // Puzzle 27: Щенок с розами - missing piece 1
  {
    id: 55,
    slug: "shchenok-s-rozami-fragment-1",
    piece: 1,
    title: "Щенок с розами - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-35.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 88
  },
  // Puzzle 28: Щенок с ромашками - missing pieces 1, 2, 3
  {
    id: 56,
    slug: "shchenok-s-romashkami-fragment-1",
    piece: 1,
    title: "Щенок с ромашками - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-39.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 84
  },
  {
    id: 57,
    slug: "shchenok-s-romashkami-fragment-2",
    piece: 2,
    title: "Щенок с ромашками - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-39.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 84
  },
  {
    id: 58,
    slug: "shchenok-s-romashkami-fragment-3",
    piece: 3,
    title: "Щенок с ромашками - Фрагмент 3",
    image: "/photo_2026-06-26_21-11-39.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 84
  },
  // Puzzle 29: Щенок в цветах - missing pieces 1, 2
  {
    id: 59,
    slug: "shchenok-v-tsvetakh-fragment-1",
    piece: 1,
    title: "Щенок в цветах - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-43.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 80
  },
  {
    id: 60,
    slug: "shchenok-v-tsvetakh-fragment-2",
    piece: 2,
    title: "Щенок в цветах - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-43.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 80
  },
  // Puzzle 30: Щенок с подсолнухами - missing piece 1
  {
    id: 61,
    slug: "shchenok-s-podsolnukhami-fragment-1",
    piece: 1,
    title: "Щенок с подсолнухами - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-51.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 93
  },
  // Puzzle 31: Щенок в поле цветов - missing pieces 1, 2, 3
  {
    id: 62,
    slug: "shchenok-v-pole-tsvetov-fragment-1",
    piece: 1,
    title: "Щенок в поле цветов - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-54.jpg",
    owner: "system",
    rarity: "legendary",
    listed: true,
    price: 98
  },
  {
    id: 63,
    slug: "shchenok-v-pole-tsvetov-fragment-2",
    piece: 2,
    title: "Щенок в поле цветов - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-54.jpg",
    owner: "system",
    rarity: "legendary",
    listed: true,
    price: 98
  },
  {
    id: 64,
    slug: "shchenok-v-pole-tsvetov-fragment-3",
    piece: 3,
    title: "Щенок в поле цветов - Фрагмент 3",
    image: "/photo_2026-06-26_21-11-54.jpg",
    owner: "system",
    rarity: "legendary",
    listed: true,
    price: 98
  },
  // Puzzle 32: Щенок с пионами - missing pieces 1, 2
  {
    id: 65,
    slug: "shchenok-s-pionami-fragment-1",
    piece: 1,
    title: "Щенок с пионами - Фрагмент 1",
    image: "/photo_2026-06-26_21-11-58.jpg",
    owner: "system",
    rarity: "legendary",
    listed: true,
    price: 105
  },
  {
    id: 66,
    slug: "shchenok-s-pionami-fragment-2",
    piece: 2,
    title: "Щенок с пионами - Фрагмент 2",
    image: "/photo_2026-06-26_21-11-58.jpg",
    owner: "system",
    rarity: "legendary",
    listed: true,
    price: 105
  },
  // Puzzle 33: Щенок с тюльпанами - missing piece 1
  {
    id: 67,
    slug: "shchenok-s-tyulpanami-fragment-1",
    piece: 1,
    title: "Щенок с тюльпанами - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-02.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 73
  },
  // Puzzle 34: Щенок с лилиями - missing pieces 1, 2, 3
  {
    id: 68,
    slug: "shchenok-s-liliyami-fragment-1",
    piece: 1,
    title: "Щенок с лилиями - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-05.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 88
  },
  {
    id: 69,
    slug: "shchenok-s-liliyami-fragment-2",
    piece: 2,
    title: "Щенок с лилиями - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-05.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 88
  },
  {
    id: 70,
    slug: "shchenok-s-liliyami-fragment-3",
    piece: 3,
    title: "Щенок с лилиями - Фрагмент 3",
    image: "/photo_2026-06-26_21-12-05.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 88
  },
  // Puzzle 35: Щенок в саду роз - missing pieces 1, 2
  {
    id: 71,
    slug: "shchenok-v-sadu-roz-fragment-1",
    piece: 1,
    title: "Щенок в саду роз - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-09.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 95
  },
  {
    id: 72,
    slug: "shchenok-v-sadu-roz-fragment-2",
    piece: 2,
    title: "Щенок в саду роз - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-09.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 95
  },
  // Puzzle 36: Щенок с фиалками - missing piece 1
  {
    id: 73,
    slug: "shchenok-s-fialkami-fragment-1",
    piece: 1,
    title: "Щенок с фиалками - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-16.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 96
  },
  // Puzzle 37: Щенок с нарциссами - missing pieces 1, 2, 3
  {
    id: 74,
    slug: "shchenok-s-nartsissami-fragment-1",
    piece: 1,
    title: "Щенок с нарциссами - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-20.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 93
  },
  {
    id: 75,
    slug: "shchenok-s-nartsissami-fragment-2",
    piece: 2,
    title: "Щенок с нарциссами - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-20.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 93
  },
  {
    id: 76,
    slug: "shchenok-s-nartsissami-fragment-3",
    piece: 3,
    title: "Щенок с нарциссами - Фрагмент 3",
    image: "/photo_2026-06-26_21-12-20.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 93
  },
  // Puzzle 38: Щенок с астрами - missing pieces 1, 2
  {
    id: 77,
    slug: "shchenok-s-astrami-fragment-1",
    piece: 1,
    title: "Щенок с астрами - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-24.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 78
  },
  {
    id: 78,
    slug: "shchenok-s-astrami-fragment-2",
    piece: 2,
    title: "Щенок с астрами - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-24.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 78
  },
  // Puzzle 39: Щенок с хризантемами - missing piece 1
  {
    id: 79,
    slug: "shchenok-s-khrizantemami-fragment-1",
    piece: 1,
    title: "Щенок с хризантемами - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-27.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 73
  },
  // Puzzle 40: Щенок с георгинами - missing pieces 1, 2, 3
  {
    id: 80,
    slug: "shchenok-s-georginami-fragment-1",
    piece: 1,
    title: "Щенок с георгинами - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-31.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 70
  },
  {
    id: 81,
    slug: "shchenok-s-georginami-fragment-2",
    piece: 2,
    title: "Щенок с георгинами - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-31.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 70
  },
  {
    id: 82,
    slug: "shchenok-s-georginami-fragment-3",
    piece: 3,
    title: "Щенок с георгинами - Фрагмент 3",
    image: "/photo_2026-06-26_21-12-31.jpg",
    owner: "system",
    rarity: "rare",
    listed: true,
    price: 70
  },
  // Puzzle 41: Щенок с пеларгонией - missing pieces 1, 2
  {
    id: 83,
    slug: "shchenok-s-pelargoniy-fragment-1",
    piece: 1,
    title: "Щенок с пеларгонией - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-34.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 98
  },
  {
    id: 84,
    slug: "shchenok-s-pelargoniy-fragment-2",
    piece: 2,
    title: "Щенок с пеларгонией - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-34.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 98
  },
  // Puzzle 42: Щенок с петуниями - missing piece 1
  {
    id: 85,
    slug: "shchenok-s-petuniyami-fragment-1",
    piece: 1,
    title: "Щенок с петуниями - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-38.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 90
  },
  // Puzzle 43: Щенок с календулой - missing pieces 1, 2, 3
  {
    id: 86,
    slug: "shchenok-s-kalenduloy-fragment-1",
    piece: 1,
    title: "Щенок с календулой - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-41.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 96
  },
  {
    id: 87,
    slug: "shchenok-s-kalenduloy-fragment-2",
    piece: 2,
    title: "Щенок с календулой - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-41.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 96
  },
  {
    id: 88,
    slug: "shchenok-s-kalenduloy-fragment-3",
    piece: 3,
    title: "Щенок с календулой - Фрагмент 3",
    image: "/photo_2026-06-26_21-12-41.jpg",
    owner: "system",
    rarity: "epic",
    listed: true,
    price: 96
  },
  // Puzzle 44: Щенок в лугу - missing pieces 1, 2
  {
    id: 89,
    slug: "shchenok-v-lugu-fragment-1",
    piece: 1,
    title: "Щенок в лугу - Фрагмент 1",
    image: "/photo_2026-06-26_21-12-55.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  {
    id: 90,
    slug: "shchenok-v-lugu-fragment-2",
    piece: 2,
    title: "Щенок в лугу - Фрагмент 2",
    image: "/photo_2026-06-26_21-12-55.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  // Puzzle 45: Щенок на поляне - missing piece 1
  {
    id: 91,
    slug: "shchenok-na-polyane-fragment-1",
    piece: 1,
    title: "Щенок на поляне - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-02.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 48
  },
  // Puzzle 46: Щенок с травой - missing pieces 1, 2, 3
  {
    id: 92,
    slug: "shchenok-s-travoy-fragment-1",
    piece: 1,
    title: "Щенок с травой - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-05.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 49
  },
  {
    id: 93,
    slug: "shchenok-s-travoy-fragment-2",
    piece: 2,
    title: "Щенок с травой - Фрагмент 2",
    image: "/photo_2026-06-26_21-13-05.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 49
  },
  {
    id: 94,
    slug: "shchenok-s-travoy-fragment-3",
    piece: 3,
    title: "Щенок с травой - Фрагмент 3",
    image: "/photo_2026-06-26_21-13-05.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 49
  },
  // Puzzle 47: Щенок в зелени - missing pieces 1, 2
  {
    id: 95,
    slug: "shchenok-v-zeleni-fragment-1",
    piece: 1,
    title: "Щенок в зелени - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-12.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 44
  },
  {
    id: 96,
    slug: "shchenok-v-zeleni-fragment-2",
    piece: 2,
    title: "Щенок в зелени - Фрагмент 2",
    image: "/photo_2026-06-26_21-13-12.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 44
  },
  // Puzzle 48: Щенок на лугу - missing piece 1
  {
    id: 97,
    slug: "shchenok-na-lugu-2-fragment-1",
    piece: 1,
    title: "Щенок на лугу - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-18.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 40
  },
  // Puzzle 49: Щенок в траве - missing pieces 1, 2, 3
  {
    id: 98,
    slug: "shchenok-v-trave-2-fragment-1",
    piece: 1,
    title: "Щенок в траве - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-21.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 41
  },
  {
    id: 99,
    slug: "shchenok-v-trave-2-fragment-2",
    piece: 2,
    title: "Щенок в траве - Фрагмент 2",
    image: "/photo_2026-06-26_21-13-21.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 41
  },
  {
    id: 100,
    slug: "shchenok-v-trave-2-fragment-3",
    piece: 3,
    title: "Щенок в траве - Фрагмент 3",
    image: "/photo_2026-06-26_21-13-21.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 41
  },
  // Puzzle 50: Щенок на природе - missing pieces 1, 2
  {
    id: 101,
    slug: "shchenok-na-prirode-fragment-1",
    piece: 1,
    title: "Щенок на природе - Фрагмент 1",
    image: "/photo_2026-06-26_21-13-25.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  },
  {
    id: 102,
    slug: "shchenok-na-prirode-fragment-2",
    piece: 2,
    title: "Щенок на природе - Фрагмент 2",
    image: "/photo_2026-06-26_21-13-25.jpg",
    owner: "system",
    rarity: "common",
    listed: true,
    price: 45
  }
];
