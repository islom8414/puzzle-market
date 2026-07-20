"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import Image from "next/image";

import { puzzles } from "@/data/puzzles";
import { apiFetch } from "@/lib/api-client";
import {
  normalizePuzzleCategory,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import { fetchMyProfile } from "@/lib/client-profile";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import { supabase } from "@/lib/supabase";
import {
  trackAddToCart,
  trackPurchase,
  trackSearch,
} from "@/lib/analytics";

type MarketItem = {
  id: number | string;
  seller_name: string;
  seller_user_id?: string;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
  rarity: string;
  category?: string;
  brand?: string | null;
  created_at?: string;
  exact_listing?: boolean;
  puzzle_rows?: number;
  puzzle_columns?: number;
  sale_type?: "Primary Sale" | "Collector Resale";
  availability?: "Available";
  available_supply?: number;
  total_supply?: number;
};

type FilterOption = {
  value: string;
  label: string;
};

function FilterMenu({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] =
    useState(false);
  const selected =
    options.find(
      (option) =>
        option.value === value
    ) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left font-bold text-white outline-none backdrop-blur-xl transition hover:border-cyan-400/50 focus:border-cyan-400 md:min-h-[64px] md:rounded-3xl md:px-6 md:py-5"
      >
        <span className="min-w-0 truncate">
          {selected?.label}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-cyan-300 transition ${open ? "rotate-180" : ""}`}
        >
          v
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-cyan-400/30 bg-zinc-950/98 p-2 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          {options.map((option) => {
            const selectedOption =
              option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black transition ${
                  selectedOption
                    ? "bg-cyan-400 text-black"
                    : "text-zinc-100 hover:bg-white/10 hover:text-cyan-200"
                }`}
              >
                <span className="truncate">
                  {option.label}
                </span>
                {selectedOption && (
                  <span aria-hidden="true">
                    -
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type MarketplaceLoadStatus =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "timeout";

const puzzleColumns = 5;
const puzzleRows = 5;

function getCurrentReturnPath() {
  if (typeof window === "undefined") {
    return "/marketplace";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function buildRegisterUrl(nextPath: string) {
  const params =
    new URLSearchParams({
      next: nextPath,
      intent: "buy",
    });

  return `/register?${params.toString()}`;
}

function categoryKey(value: string | null | undefined) {
  const raw = String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/\band\b/gi, "&")
    .trim();

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function categoryMatches(
  itemCategory: string | null | undefined,
  selectedCategory: string
) {
  if (selectedCategory === "ALL") {
    return true;
  }

  const selectedKey = categoryKey(selectedCategory);
  const rawItemKey = categoryKey(itemCategory);
  const normalizedItemKey = categoryKey(
    normalizePuzzleCategory(itemCategory)
  );

  return (
    rawItemKey === selectedKey ||
    normalizedItemKey === selectedKey
  );
}

function getStoredLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");

  return (
    queryLanguage ||
    window.localStorage.getItem("puzzle-language") ||
    document.documentElement.lang ||
    "en"
  ).toLowerCase();
}

const ruCategoryLabels: Record<string, string> = {
  Animals: "Животные",
  Anime: "Аниме",
  Art: "Искусство",
  Baseball: "Бейсбол",
  Cars: "Автомобили",
  Fashion: "Мода",
  "Food & Drink": "Еда и напитки",
  Football: "Футбол",
  Flowers: "Цветы",
  Gaming: "Игры",
  Golf: "Гольф",
  Music: "Музыка",
  Nature: "Природа",
  Space: "Космос",
  Sports: "Спорт",
  Technology: "Технологии",
  Toys: "Игрушки",
  "Travel & Landmarks": "Путешествия и достопримечательности",
  "World Money": "Мировые деньги",
  Other: "Другое",
};

void ruCategoryLabels;

type UiLanguage = "en" | "ru" | "ja";

function getUiLanguage(language: string): UiLanguage {
  if (language.startsWith("ru")) {
    return "ru";
  }

  if (language.startsWith("ja")) {
    return "ja";
  }

  return "en";
}

const categoryLabels: Record<UiLanguage, Record<string, string>> = {
  en: {},
  ru: {
    Animals: "Животные",
    Anime: "Аниме",
    Art: "Искусство",
    Baseball: "Бейсбол",
    Cars: "Автомобили",
    Fashion: "Мода",
    "Food & Drink": "Еда и напитки",
    Football: "Футбол",
    Flowers: "Цветы",
    Gaming: "Игры",
    Golf: "Гольф",
    Music: "Музыка",
    Nature: "Природа",
    Space: "Космос",
    Sports: "Спорт",
    Technology: "Технологии",
    Toys: "Игрушки",
    "Travel & Landmarks": "Путешествия и достопримечательности",
    "World Money": "Мировые деньги",
    Other: "Другое",
  },
  ja: {
    Animals: "動物",
    Anime: "アニメ",
    Art: "アート",
    Baseball: "野球",
    Cars: "車",
    Fashion: "ファッション",
    "Food & Drink": "フード・ドリンク",
    Football: "サッカー",
    Flowers: "花",
    Gaming: "ゲーム",
    Golf: "ゴルフ",
    Music: "音楽",
    Nature: "自然",
    Space: "宇宙",
    Sports: "スポーツ",
    Technology: "テクノロジー",
    Toys: "おもちゃ",
    "Travel & Landmarks": "旅行・名所",
    "World Money": "世界のお金",
    Other: "その他",
  },
};

function createMarketplaceCopy(language: string) {
  const copies: Record<UiLanguage, Record<string, string>> = {
    en: {
      eyebrow: "LIVE MARKETPLACE",
      titleLineOne: "Trade Rare",
      titleLineTwo: "Puzzle Fragments",
      defaultDescription:
        "Browse collectible puzzle fragments available from Puzzle Market and other collectors.",
      exactPieceDescription:
        "Only the exact missing piece for this puzzle is shown here. If it is not listed, the current owner has not put it back on sale yet.",
      puzzleDescription:
        "All active missing pieces for this puzzle are shown here. Buy each missing fragment to complete the image.",
      choosePuzzle: "Choose A Puzzle",
      liveListings: "Live Listings",
      primarySale: "Primary Sale",
      collectorResale: "Collector Resale",
      marketplaceAccess: "Marketplace Access",
      open: "Open",
      buyNowListLater: "Buy now, list later",
      search: "Search rare fragments...",
      exactPuzzleFilter: "Exact puzzle filter is active",
      allRarity: "All Rarity",
      legendary: "Legendary",
      epic: "Epic",
      rare: "Rare",
      allCategories: "All Categories",
      allSaleTypes: "All Sale Types",
      allPrices: "All Prices",
      under25: "Under $25",
      over100: "Over $100",
      available: "Available",
      price: "PRICE",
      piece: "Piece",
      availableSupply: "Available Supply",
      totalSupply: "Total Supply",
      supply: "Supply",
      listedByPuzzleMarket: "Listed by Puzzle Market.",
      listedByCollector: "Listed by",
      collectorFallback: "a collector",
      buyPiece: "Buy Piece",
      thisPieceIsYours: "This Piece Is Yours",
      openingCheckout: "Opening checkout...",
      loading: "Loading...",
      loadMore: "Load More Listings",
      couldNotLoad: "Marketplace listings could not be loaded.",
      timeout:
        "The request took too long. Try again on a better connection.",
      failed:
        "The request failed before live listings could be confirmed.",
      tryAgain: "Try Again",
      noListings: "No active listings are available right now.",
      emptyCopy:
        "Browse collections, create a watchlist or become the first seller.",
      browseCollections: "Browse Collections",
      createFreeAccount: "Create Free Account",
      noMatches: "No matching fragments found",
      noMatchesCopy:
        "The marketplace has live listings, but none match the current filters.",
      showAllFragments: "Show All Fragments",
    },
    ru: {
      eyebrow: "ЖИВОЙ МАРКЕТПЛЕЙС",
      titleLineOne: "Редкие",
      titleLineTwo: "пазл-фрагменты",
      defaultDescription:
        "Просматривайте коллекционные фрагменты от Puzzle Market и других коллекционеров.",
      exactPieceDescription:
        "Здесь показан только нужный фрагмент этого пазла. Если его нет в списке, владелец еще не выставил его на продажу.",
      puzzleDescription:
        "Здесь показаны все активные недостающие фрагменты этого пазла. Купите нужные части, чтобы завершить изображение.",
      choosePuzzle: "Выбрать пазл",
      liveListings: "Активные лоты",
      primarySale: "Официальная продажа",
      collectorResale: "Перепродажа коллекционера",
      marketplaceAccess: "Маркетплейс",
      open: "Открыто",
      buyNowListLater: "Купить сейчас, выставить позже",
      search: "Поиск редких фрагментов...",
      exactPuzzleFilter: "Включен фильтр точного пазла",
      allRarity: "Любая редкость",
      legendary: "Легендарный",
      epic: "Эпический",
      rare: "Редкий",
      allCategories: "Все категории",
      allSaleTypes: "Все типы продаж",
      allPrices: "Все цены",
      under25: "До $25",
      over100: "Больше $100",
      available: "Доступно",
      price: "ЦЕНА",
      piece: "Фрагмент",
      availableSupply: "Доступно",
      totalSupply: "Всего",
      supply: "Наличие",
      listedByPuzzleMarket: "Выставлено Puzzle Market.",
      listedByCollector: "Выставил",
      collectorFallback: "коллекционер",
      buyPiece: "Купить фрагмент",
      thisPieceIsYours: "Этот фрагмент ваш",
      openingCheckout: "Открываем оплату...",
      loading: "Загрузка...",
      loadMore: "Загрузить еще",
      couldNotLoad: "Не удалось загрузить лоты маркетплейса.",
      timeout:
        "Запрос выполнялся слишком долго. Попробуйте снова при более стабильном соединении.",
      failed: "Запрос не завершился до проверки активных лотов.",
      tryAgain: "Повторить",
      noListings: "Сейчас нет активных лотов.",
      emptyCopy:
        "Посмотрите коллекции, создайте список наблюдения или станьте первым продавцом.",
      browseCollections: "Смотреть коллекции",
      createFreeAccount: "Создать бесплатный аккаунт",
      noMatches: "Подходящие фрагменты не найдены",
      noMatchesCopy:
        "На маркетплейсе есть лоты, но они не подходят под текущие фильтры.",
      showAllFragments: "Показать все фрагменты",
    },
    ja: {
      eyebrow: "ライブマーケット",
      titleLineOne: "希少な",
      titleLineTwo: "パズルフラグメント",
      defaultDescription:
        "Puzzle Market と他のコレクターが出品しているコレクション用フラグメントを探せます。",
      exactPieceDescription:
        "このパズルに必要なピースだけを表示しています。表示されない場合、現在の所有者はまだ再出品していません。",
      puzzleDescription:
        "このパズルの販売中の不足ピースを表示しています。必要なフラグメントを集めて画像を完成させましょう。",
      choosePuzzle: "パズルを選ぶ",
      liveListings: "出品中",
      primarySale: "公式販売",
      collectorResale: "コレクター再販",
      marketplaceAccess: "マーケット",
      open: "公開中",
      buyNowListLater: "購入後に再出品できます",
      search: "フラグメントを検索...",
      exactPuzzleFilter: "対象パズルで絞り込み中",
      allRarity: "すべてのレア度",
      legendary: "レジェンダリー",
      epic: "エピック",
      rare: "レア",
      allCategories: "すべてのカテゴリ",
      allSaleTypes: "すべての販売タイプ",
      allPrices: "すべての価格",
      under25: "$25未満",
      over100: "$100超",
      available: "購入可能",
      price: "価格",
      piece: "ピース",
      availableSupply: "在庫",
      totalSupply: "総数",
      supply: "在庫",
      listedByPuzzleMarket: "Puzzle Market が出品中。",
      listedByCollector: "出品者",
      collectorFallback: "コレクター",
      buyPiece: "ピースを購入",
      thisPieceIsYours: "このピースはあなたのものです",
      openingCheckout: "チェックアウトを開いています...",
      loading: "読み込み中...",
      loadMore: "さらに読み込む",
      couldNotLoad: "マーケットの出品を読み込めませんでした。",
      timeout:
        "時間がかかりすぎています。通信環境を確認して再試行してください。",
      failed: "出品を確認する前にリクエストが失敗しました。",
      tryAgain: "再試行",
      noListings: "現在、販売中の出品はありません。",
      emptyCopy:
        "コレクションを見たり、ウォッチリストを作ったり、最初の出品者になれます。",
      browseCollections: "コレクションを見る",
      createFreeAccount: "無料アカウント作成",
      noMatches: "条件に合うフラグメントがありません",
      noMatchesCopy:
        "出品はありますが、現在のフィルターに一致しません。",
      showAllFragments: "すべて表示",
    },
  };

  return copies[getUiLanguage(language)];
}

export default function MarketplaceClient({
  initialListings,
  initialActiveCount,
  initialNextOffset,
  initialStatus,
}: {
  initialListings: MarketItem[];
  initialActiveCount: number | null;
  initialNextOffset: number | null;
  initialStatus: "success" | "error";
}) {

  const [marketItems, setMarketItems] =
    useState<MarketItem[]>(
      initialListings
    );

  const [loadStatus, setLoadStatus] =
    useState<MarketplaceLoadStatus>(
      initialStatus === "error"
        ? "error"
        : initialListings.length === 0
          ? "empty"
          : "success"
    );

  const [activeCount, setActiveCount] =
    useState<number | null>(
      initialActiveCount
    );

  const [nextOffset, setNextOffset] =
    useState<number | null>(
      initialNextOffset
    );

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [pendingPurchaseId, setPendingPurchaseId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [saleTypeFilter, setSaleTypeFilter] =
    useState("ALL");

  const [priceRangeFilter, setPriceRangeFilter] =
    useState("ALL");

  const [puzzleFilter, setPuzzleFilter] =
    useState("");

  const [pieceFilter, setPieceFilter] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [uiLanguage] =
    useState(() => getStoredLanguage());

  const filterBootedRef = useRef(false);

  const ui = useMemo(
    () =>
      createMarketplaceCopy(uiLanguage),
    [uiLanguage]
  );
  const uiLanguageKey = getUiLanguage(uiLanguage);
  const localizedCategoryLabels = categoryLabels[uiLanguageKey];

  const categoryLabel = (
    category: string | null | undefined
  ) => {
    const normalized =
      normalizePuzzleCategory(category);

    return localizedCategoryLabels[normalized] || normalized;
  };

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const searchParam =
      params.get("search");

    const puzzleParam =
      params.get("puzzle");

    const pieceParam =
      params.get("piece");

    if (searchParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(searchParam);
    }

    if (puzzleParam) {
      setPuzzleFilter(puzzleParam);

      const selectedPuzzle =
        puzzles.find(
          (item) =>
            item.slug === puzzleParam
        );

      if (selectedPuzzle) {
        setSearch(
          selectedPuzzle.title
        );
      }
    }

    if (pieceParam) {
      setPieceFilter(pieceParam);
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setCurrentUserId(
          data.user?.id || ""
        );
      });

    if (puzzleParam) {
      // eslint-disable-next-line react-hooks/immutability
      loadExactMarketplace(
        puzzleParam,
        pieceParam || ""
      );
    }

  }, [initialStatus]);

  useEffect(() => {
    const searchTerm =
      search.trim();

    if (!searchTerm || puzzleFilter) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        trackSearch(searchTerm);
      }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, puzzleFilter]);

  const availableCategories = useMemo(
    () => [...PUZZLE_CATEGORIES],
    []
  );

  const activeCategoryFilter =
    categoryFilter;

  async function loadMarketplace({
    append = false,
    silent = false,
    offset = 0,
  }: {
    append?: boolean;
    silent?: boolean;
    offset?: number;
  } = {}) {
    if (!silent) {
      setLoadStatus("loading");
    }

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(() => {
        controller.abort();
      }, 10000);

    try {
      const params =
        new URLSearchParams({
          limit: "12",
          offset: String(offset),
          search: search.trim(),
          category: activeCategoryFilter,
          rarity: rarityFilter,
          saleType: saleTypeFilter,
          priceRange: priceRangeFilter,
        });

      const response =
        await apiFetch(
          `/api/marketplace-listings?${params.toString()}`,
          {
            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Marketplace listings could not be loaded."
        );
      }

      const data =
        await response.json();

      const listings =
        data.listings || [];

      setMarketItems((current) =>
        append
          ? [
              ...current,
              ...listings,
            ]
          : listings
      );
      setActiveCount(
        typeof data.activeCount === "number"
          ? data.activeCount
          : listings.length
      );
      setNextOffset(
        typeof data.nextOffset === "number"
          ? data.nextOffset
          : null
      );
      setLoadStatus(
        listings.length === 0 &&
        !append
          ? "empty"
          : "success"
      );
    } catch (error) {
      console.error(error);
      if (!silent) {
        setLoadStatus(
          error instanceof DOMException &&
            error.name === "AbortError"
            ? "timeout"
            : "error"
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function loadMoreListings() {
    if (nextOffset === null) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadMarketplace({
        append: true,
        offset: nextOffset,
        silent: true,
      });
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (puzzleFilter) {
      return;
    }

    const hasActiveFilters =
      Boolean(search.trim()) ||
      rarityFilter !== "ALL" ||
      categoryFilter !== "ALL" ||
      saleTypeFilter !== "ALL" ||
      priceRangeFilter !== "ALL";

    if (!filterBootedRef.current) {
      filterBootedRef.current = true;

      if (!hasActiveFilters) {
        return;
      }
    }

    const timer =
      window.setTimeout(() => {
        void loadMarketplace();
      }, 250);

    return () => {
      window.clearTimeout(timer);
    };
    // loadMarketplace intentionally reads the latest filter state from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    rarityFilter,
    categoryFilter,
    saleTypeFilter,
    priceRangeFilter,
    puzzleFilter,
  ]);

  const filteredFragments =
    useMemo(() => {

      return marketItems.filter(
        (fragment) => {

          if (puzzleFilter) {
            const fragmentPiece =
              Number(
                fragment.piece
              );

            const requestedPiece =
              Number(
                pieceFilter
              );

            const matchesPuzzle =
              fragment.fragment_id ===
              puzzleFilter;

            const matchesPiece =
              !pieceFilter ||
              fragment.piece ===
                pieceFilter ||
              fragmentPiece ===
                requestedPiece ||
              fragmentPiece ===
                requestedPiece + 1;

            return (
              matchesPuzzle &&
              matchesPiece
            );
          }

          const matchesSearch =
            fragment.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesRarity =
            rarityFilter ===
            "ALL"
              ? true
              : fragment.rarity ===
                rarityFilter;

          const matchesCategory =
            categoryMatches(
              fragment.category,
              activeCategoryFilter
            );

          const matchesSaleType =
            saleTypeFilter === "ALL"
              ? true
              : fragment.sale_type ===
                saleTypeFilter;

          const matchesPriceRange =
            priceRangeFilter === "ALL"
              ? true
              : priceRangeFilter === "UNDER_25"
                ? fragment.price < 25
                : priceRangeFilter === "25_100"
                  ? fragment.price >= 25 &&
                    fragment.price <= 100
                  : fragment.price > 100;

          return (
            matchesSearch &&
            matchesRarity &&
            matchesCategory &&
            matchesSaleType &&
            matchesPriceRange
          );

        }
      );

    }, [
      marketItems,
      search,
      rarityFilter,
      activeCategoryFilter,
      saleTypeFilter,
      priceRangeFilter,
      puzzleFilter,
      pieceFilter,
    ]);

  const primarySaleCount = useMemo(
    () =>
      marketItems.filter(
        (item) =>
          item.sale_type === "Primary Sale"
      ).length,
    [marketItems]
  );

  const collectorResaleCount = useMemo(
    () =>
      marketItems.filter(
        (item) =>
          item.sale_type ===
          "Collector Resale"
      ).length,
    [marketItems]
  );

  const hasCollectorResales =
    collectorResaleCount > 0;

  const rarityOptions = [
    {
      value: "ALL",
      label: ui.allRarity,
    },
    {
      value: "Legendary",
      label: ui.legendary,
    },
    {
      value: "Epic",
      label: ui.epic,
    },
    {
      value: "Rare",
      label: ui.rare,
    },
  ];

  const categoryOptions = [
    {
      value: "ALL",
      label: ui.allCategories,
    },
    ...availableCategories.map((item) => ({
      value: item,
      label: categoryLabel(item),
    })),
  ];

  const saleTypeOptions = [
    {
      value: "ALL",
      label: ui.allSaleTypes,
    },
    {
      value: "Primary Sale",
      label: ui.primarySale,
    },
    ...(hasCollectorResales
      ? [
          {
            value: "Collector Resale",
            label: ui.collectorResale,
          },
        ]
      : []),
  ];

  const priceRangeOptions = [
    {
      value: "ALL",
      label: ui.allPrices,
    },
    {
      value: "UNDER_25",
      label: ui.under25,
    },
    {
      value: "25_100",
      label: "$25 - $100",
    },
    {
      value: "OVER_100",
      label: ui.over100,
    },
  ];

  const isLoading =
    loadStatus === "loading";

  const isRequestProblem =
    loadStatus === "error" ||
    loadStatus === "timeout";

  const isTrueEmpty =
    loadStatus === "empty" &&
    marketItems.length === 0;

  const isFilteredEmpty =
    loadStatus === "success" &&
    marketItems.length > 0 &&
    filteredFragments.length === 0;

  const rarityGlow = (
    rarity: string
  ) => {

    if (
      rarity ===
      "Legendary"
    ) {

      return "shadow-[0_0_40px_rgba(255,215,0,0.35)] border-yellow-400/30";

    }

    if (
      rarity === "Epic"
    ) {

      return "shadow-[0_0_40px_rgba(168,85,247,0.35)] border-purple-400/30";

    }

    return "shadow-[0_0_40px_rgba(34,211,238,0.25)] border-cyan-400/20";

  };

  const getPuzzleForFragment = (
    fragment: MarketItem
  ) =>
    puzzles.find(
      (item) =>
        item.slug ===
        fragment.fragment_id
    );

  const piecePreviewStyle = (
    fragment: MarketItem
  ) => {
    const puzzle =
      getPuzzleForFragment(
        fragment
      );

    const image =
      fragment.image ||
      puzzle?.image;

    if (!image) {
      return null;
    }

    const columns =
      fragment.puzzle_columns ||
      puzzleColumns;

    const rows =
      fragment.puzzle_rows ||
      puzzleRows;

    const rawPiece =
      Number(fragment.piece);

    const piece =
      Number.isFinite(rawPiece)
        ? ((rawPiece %
            (rows * columns)) +
            (rows * columns)) %
          (rows * columns)
        : 0;

    const col = piece % columns;

    const row = Math.floor(
      piece / columns
    );

    const colDenominator =
      columns > 1 ? columns - 1 : 1;

    const rowDenominator =
      rows > 1 ? rows - 1 : 1;

    return {
      backgroundImage: `url(${image})`,
      backgroundSize:
        `${columns * 100}% ${rows * 100}%`,
      backgroundPosition:
        `${(col / colDenominator) * 100}% ${(row / rowDenominator) * 100}%`,
    };
  };

  const isOwnListing = (
    fragment: MarketItem
  ) =>
    !!fragment.seller_user_id &&
    !!currentUserId &&
    fragment.seller_user_id ===
      currentUserId;

  async function loadExactMarketplace(
    puzzleSlug: string,
    piece: string
  ) {
      setLoadStatus("loading");

      const params =
        new URLSearchParams({
          puzzle: puzzleSlug,
        });

      if (piece.trim()) {
        params.set("piece", piece);
      }

      const controller =
        new AbortController();

      const timeoutId =
        window.setTimeout(() => {
          controller.abort();
        }, 10000);

      try {
        const response =
          await apiFetch(
            `/api/puzzle-market-listings?${params.toString()}`,
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Marketplace listings could not be loaded."
          );
        }

        const data =
          await response.json();

        const listings =
          data.listings || [];

        setMarketItems(listings);
        setActiveCount(listings.length);
        setNextOffset(null);
        setLoadStatus(
          listings.length === 0
            ? "empty"
            : "success"
        );
      } catch (error) {
        console.error(error);
        setLoadStatus(
          error instanceof DOMException &&
            error.name === "AbortError"
            ? "timeout"
            : "error"
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
  }

  const purchaseFragment =
    async (
      fragment: MarketItem
    ) => {
      const purchaseId =
        String(fragment.id);

      try {
        setPendingPurchaseId(
          purchaseId
        );

        const {
          data: {
            session,
          },
        } =
          await supabase.auth
            .getSession();

        if (!session) {
          window.location.assign(
            buildRegisterUrl(
              getCurrentReturnPath()
            )
          );

          return;

        }

        const profile =
          await fetchMyProfile();

        if (!profile?.profileComplete) {
          window.location.assign(
            "/setup"
          );
          return;
        }

        if (!profile.hasActiveSubscription) {
          const upgrade =
            window.confirm(
              "Start a 3-day free trial to buy and resell puzzle pieces. Add a card now, but the subscription is not charged today. Open plans?"
            );

          if (upgrade) {
            window.location.assign(
              `/subscribe?next=${encodeURIComponent(getCurrentReturnPath())}`
            );
          }

          return;
        }

        const username =
          profile?.username ||
          session.user.email
            ?.split("@")[0]
            ?.replace(
              /[^a-zA-Z0-9_-]/g,
              ""
            )
            ?.slice(0, 40) ||
          "PuzzleUser";

        if (
          !fragment.exact_listing ||
          typeof fragment.id !== "string"
        ) {
          alert(
            "This old listing is no longer available."
          );

          return;
        }

        const analyticsItem = {
          item_id: String(fragment.id),
          item_name: `${fragment.title} Piece #${fragment.piece}`,
          item_category:
            normalizePuzzleCategory(
              fragment.category
            ),
          item_brand:
            fragment.brand || undefined,
          price: fragment.price,
          quantity: 1,
        };

        trackAddToCart(analyticsItem);

        const response =
          await apiFetch(
            "/api/purchase-listing",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                listingId:
                  fragment.id,
                username,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          alert(
            data.error ||
            "Purchase failed"
          );

          return;

        }

        trackPurchase({
          transaction_id:
            data.tradeId ||
            data.purchaseId ||
            `listing_${fragment.id}`,
          value: fragment.price,
          items: [analyticsItem],
        });

        alert(
          data.rewardApplied
            ? data.emailSent
              ? "Referral reward applied. Purchase completed and your ownership certificate was emailed."
              : `Referral reward applied. Purchase completed, but certificate email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""}`
            : data.emailSent
              ? "Purchase completed. Your puzzle progress is saved. Returning to assembly."
              : `Purchase completed. Certificate email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""}`
        );

        if (puzzleFilter) {
          window.location.assign(
            `/puzzle/${encodeURIComponent(puzzleFilter)}`
          );
        } else {
          void loadMarketplace();
        }

      } catch (error) {

        console.log(error);

        alert(
          "Purchase failed"
        );

      } finally {
        setPendingPurchaseId(null);
      }

    };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* HERO */}

      <section className="relative border-b border-white/5">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_35%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-16 pb-12 md:pb-14">

          <p className="text-cyan-400 font-black uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs">
            {ui.eyebrow}
          </p>

          <h1 className="translate-safe-title font-black mt-4 md:mt-5 max-w-5xl">
            {ui.titleLineOne}
            <br />
            {ui.titleLineTwo}
          </h1>

          <p className="translate-safe-copy text-zinc-400 text-base md:text-lg mt-6 md:mt-8 leading-relaxed">
            {puzzleFilter
              ? pieceFilter
                ? ui.exactPieceDescription
                : ui.puzzleDescription
              : ui.defaultDescription}
          </p>

          <div className="flex flex-wrap gap-3 md:gap-4 mt-8 md:mt-10">
            <Link
              href={CHOOSE_PUZZLE_HREF}
              className="inline-flex w-full sm:w-auto justify-center rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
            >
              {ui.choosePuzzle}
            </Link>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-10 md:mt-12">

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                {ui.liveListings}
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                {activeCount === null ||
                isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-24 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  activeCount
                )}
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                {ui.primarySale}
              </p>

              <h3 className="translate-safe-stat text-cyan-400 font-black mt-3">
                {isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-20 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  primarySaleCount
                )}
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                {ui.marketplaceAccess}
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                {isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-20 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  ui.open
                )}
              </h3>

              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {ui.buyNowListLater}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_210px_190px_170px] gap-4 md:gap-5 mb-10 md:mb-12">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder={
              puzzleFilter
                ? ui.exactPuzzleFilter
                : ui.search
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          />

          <FilterMenu
            value={rarityFilter}
            options={rarityOptions}
            onChange={setRarityFilter}
            ariaLabel={ui.allRarity}
          />

          <FilterMenu
            value={activeCategoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
            ariaLabel={ui.allCategories}
          />

          <FilterMenu
            value={saleTypeFilter}
            options={saleTypeOptions}
            onChange={setSaleTypeFilter}
            ariaLabel={ui.allSaleTypes}
          />

          <FilterMenu
            value={priceRangeFilter}
            options={priceRangeOptions}
            onChange={setPriceRangeFilter}
            ariaLabel={ui.allPrices}
          />

        </div>

        {/* LOADING */}

        {isLoading && (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] md:rounded-[32px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
              >
                <div className="h-[260px] md:h-[340px] animate-pulse rounded-3xl bg-white/10" />
                <div className="mt-6 h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-9 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="mt-6 h-14 animate-pulse rounded-2xl bg-white/10" />
              </div>
            ))}
          </div>

        )}

        {isRequestProblem && (

          <div className="bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              {ui.couldNotLoad}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-zinc-500 text-lg">
              {loadStatus === "timeout"
                ? ui.timeout
                : ui.failed}
            </p>

            <button
              onClick={() => {
                void loadMarketplace();
              }}
              className="mt-8 rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
            >
              {ui.tryAgain}
            </button>

          </div>

        )}

        {/* GRID */}

        {!isLoading && !isRequestProblem && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8">

          {filteredFragments.map(
            (fragment) => (

              <div
                key={fragment.id}
                className={`group relative rounded-[24px] md:rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(fragment.rarity)}`}
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden">

                  {piecePreviewStyle(
                    fragment
                  ) ? (
                    <div className="h-[260px] md:h-[340px] bg-black flex items-center justify-center">
                      <div
                        className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.18)] transition duration-700 group-hover:scale-105"
                        style={
                          piecePreviewStyle(
                            fragment
                          ) || undefined
                        }
                      />
                    </div>
                  ) : (
                    <Image
                      src={
                        fragment.image
                      }
                      alt={
                        fragment.title
                      }
                      width={720}
                      height={520}
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      loading="lazy"
                      className="w-full h-[260px] md:h-[340px] object-cover transition duration-700 group-hover:scale-110"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* BADGES */}

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">

                    <div className="bg-black/70 backdrop-blur-xl px-3 py-2 rounded-full text-[11px] md:text-xs font-black text-cyan-400 border border-cyan-400/20">
                      {
                        fragment.rarity
                      }
                    </div>

                    <div className="bg-black/70 backdrop-blur-xl px-3 py-2 rounded-full text-[11px] md:text-xs font-black text-white border border-white/10">
                      {fragment.sale_type ||
                        ui.collectorResale}
                    </div>

                  </div>

                  {/* PRICE FLOAT */}

                  <div className="absolute bottom-4 md:bottom-5 right-4 md:right-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 md:px-5 py-3">

                    <p className="text-zinc-500 text-xs">
                      {ui.price}
                    </p>

                    <h3 className="text-cyan-400 text-2xl md:text-3xl font-black">
                      $
                      {
                        fragment.price
                      }
                    </h3>

                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-5 md:p-6">

                  <p className="text-base font-black uppercase tracking-wide text-white md:text-lg">
                    {
                      fragment.title
                    }
                  </p>

                  <p className="mt-2 text-sm font-bold text-cyan-300">
                    {categoryLabel(fragment.category)}
                    {fragment.brand
                      ? ` / ${fragment.brand}`
                      : ""}
                  </p>

                  <h2 className="text-2xl md:text-3xl font-black mt-2">
                    {ui.piece} #
                    {
                      fragment.piece
                    }
                  </h2>

                  <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div>
                      <p className="text-xs text-zinc-500">
                        {ui.supply}
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {fragment.available_supply ?? 1} / {fragment.total_supply ??
                          (fragment.puzzle_rows || puzzleRows) *
                            (fragment.puzzle_columns || puzzleColumns)}
                      </p>
                    </div>

                    <div className="rounded-full bg-green-400 px-3 py-1 text-[11px] font-black text-black">
                      {fragment.availability || ui.available}
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-zinc-500">
                    {fragment.sale_type ===
                    "Primary Sale"
                      ? ui.listedByPuzzleMarket
                      : `${ui.listedByCollector} ${fragment.seller_name || ui.collectorFallback}.`}
                  </p>

                  {/* BUTTON */}

                  <button
                    disabled={
                      isOwnListing(
                        fragment
                      ) ||
                      pendingPurchaseId ===
                        String(fragment.id)
                    }
                    onClick={() =>
                      purchaseFragment(
                        fragment
                      )
                    }

className="
mt-6
flex
items-center
justify-center
w-full
disabled:bg-zinc-700
disabled:text-zinc-400
bg-green-400
hover:bg-green-300
text-black
font-black
py-4
rounded-2xl
transition
duration-300
"

>

{isOwnListing(fragment)
  ? ui.thisPieceIsYours
  : pendingPurchaseId ===
      String(fragment.id)
    ? ui.openingCheckout
  : `${ui.buyPiece} - $${fragment.price}`}

</button>

                </div>

              </div>

            )
          )}

        </div>
        )}

        {!isLoading &&
          !isRequestProblem &&
          !isTrueEmpty &&
          nextOffset !== null && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  void loadMoreListings();
                }}
                disabled={loadingMore}
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-7 py-4 font-black text-cyan-200 transition hover:border-cyan-300 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore
                  ? ui.loading
                  : ui.loadMore}
              </button>
            </div>
          )}

        {/* EMPTY */}

        {isTrueEmpty && (

          <div className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              {ui.noListings}
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              {ui.emptyCopy}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={CHOOSE_PUZZLE_HREF}
                className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
              >
                {ui.browseCollections}
              </Link>
              <Link
                href="/register"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black text-white"
              >
                {ui.createFreeAccount}
              </Link>
            </div>

          </div>

        )}

        {isFilteredEmpty && (

          <div className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              {ui.noMatches}
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              {ui.noMatchesCopy}
            </p>

              <button
                onClick={() => {
                  setSearch("");
                  setPuzzleFilter("");
                  setPieceFilter("");
                  setRarityFilter("ALL");
                  setCategoryFilter("ALL");
                  setSaleTypeFilter("ALL");
                  setPriceRangeFilter("ALL");
                  window.history.replaceState(
                    null,
                    "",
                    "/marketplace"
                  );
                }}
                className="mt-8 bg-cyan-400 text-black font-black px-6 py-4 rounded-2xl"
              >
                {ui.showAllFragments}
              </button>

          </div>

        )}

      </section>

    </main>

  );
}
