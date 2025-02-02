"use client";

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
  RefObject,
  Dispatch,
  SetStateAction,
} from "react";
import {
  MultipleSelector,
  type MultipleSelectorRef,
  type Option,
} from "@/components/ui/multiple-selector";
import type { YSWSIndex } from "@/lib/types";
import useSWRImmutable from "swr/immutable";
import { getAll_YSWS } from "@/lib/airtable/ysws_index";
import createFuzzySearch from "@nozbe/microfuzz";

type YSWSContextType = {
  serverYSWSOptions: Option[];
  isLoading: boolean;
  error: unknown;
  fuzzySearch: (query: string) => Option[];
  fixedSelectedOptions: Option[];
  yswsData: (YSWSIndex & { id: string })[] | undefined;
  ref: RefObject<MultipleSelectorRef | null>;
  selectedLength: number;
  setSelectedLength: Dispatch<SetStateAction<number>>;
  onChangeExtra?: (selected: Option[]) => void;
};

const YSWSContext = createContext<YSWSContextType | null>(null);

export function YSWS_SelectorProvider({
  children,
  getInitialValue,
  onChangeExtra,
}: {
  children: React.ReactNode;
  getInitialValue?: (
    yswsData: (YSWSIndex & { id: string }[]) | undefined
  ) => Option[];
  onChangeExtra?: (selected: Option[]) => void;
}) {
  const {
    data: yswsData,
    error,
    isLoading,
  } = useSWRImmutable("/api/ysws/all", async () => (await getAll_YSWS()) ?? []);

  const serverYSWSOptions = useMemo(() => {
    const data = (yswsData?.map((ysws) => ({
      ...ysws,
      value: ysws.id,
      label: ysws.name ?? "",
      img_url: ysws.logo?.[0]?.url ?? "",
    })) ?? []) as unknown as Option[];
    return data;
  }, [yswsData]);

  const fuzzySearch = useCallback(
    (query: string) => {
      const fuzzySearch = createFuzzySearch(serverYSWSOptions, {
        getText: (item: YSWSIndex) =>
          [item.name, item.description, item.homepage_url].filter(
            Boolean
          ) as string[],
      });

      return fuzzySearch(query).map((result) => result.item);
    },
    [serverYSWSOptions]
  );

  const fixedSelectedOptions = useMemo(() => {
    return getInitialValue?.(yswsData) ?? [];
  }, [getInitialValue, yswsData]);

  const ref = useRef<MultipleSelectorRef>(null);
  const [selectedLength, setSelectedLength] = useState(-1);

  useEffect(() => {
    if (!isLoading) {
      setSelectedLength(fixedSelectedOptions.length);
    }
  }, [fixedSelectedOptions, isLoading]);

  const value = {
    serverYSWSOptions,
    isLoading,
    error,
    fuzzySearch,
    fixedSelectedOptions,
    yswsData,
    ref,
    selectedLength,
    setSelectedLength,
    onChangeExtra,
  };

  return <YSWSContext.Provider value={value}>{children}</YSWSContext.Provider>;
}

export function useYSWSSelector() {
  const context = useContext(YSWSContext);
  if (!context) {
    throw new Error("useYSWS must be used within a YSWSProvider");
  }
  return context;
}

export default function YSWS_Selector({
  maxSelected,
}: {
  maxSelected?: number;
}) {
  const {
    serverYSWSOptions,
    fuzzySearch,
    fixedSelectedOptions,
    ref,
    setSelectedLength,
    onChangeExtra,
  } = useYSWSSelector();

  return (
    <MultipleSelector
      ref={ref}
      onChange={(selected) => {
        setSelectedLength(selected.length);
        onChangeExtra?.(selected);
      }}
      placeholder="Nothing here yet..."
      value={fixedSelectedOptions}
      hidePlaceholderWhenSelected={true}
      onSearchSync={fuzzySearch}
      options={serverYSWSOptions}
      maxSelected={maxSelected}
      className="w-full"
    />
  );
}
