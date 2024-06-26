/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { Cuisine } from "../../../../../__generated__/graphql";

// Hooks
import { useCallback, useEffect, useMemo, useState } from "react";

// Components
import CategorySelectorSearchBar from "../tpq-category-selector/components/search-bar/CategorySelectorSearchBar";
import TPQCategorySelector, {
  Category,
} from "../tpq-category-selector/TPQCategorySelector";

interface TPQCuisineSelectorProps {
  cuisineData: Cuisine[];
  selectedCuisines: Cuisine[];
  onSelectedCuisinesUpdate: (cuisines: Cuisine[]) => void;
}

export default function TPQCuisineSelector({
  cuisineData,
  selectedCuisines,
  onSelectedCuisinesUpdate,
}: TPQCuisineSelectorProps) {
  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBarPlaceholder, setSearchBarPlaceholder] = useState("");

  // Set a dynamic placeholder for the search bar when this component mounts
  useEffect(() => {
    setSearchBarPlaceholder(getRandomCategoryTitle);
  }, []);

  // Action Handlers
  const onSearchQueryUpdateHandler = (textInput: string) => {
    setSearchQuery(textInput);
  };

  const onSelectHandler = (id: string, currentSelectionState: boolean) => {
    let updatedSelectedCategories = mapCuisinesToCategories()(selectedCuisines);

    if (currentSelectionState == false) {
      // Not yet selected
      const category = categories.find((category) => category.id == id);

      if (category) updatedSelectedCategories.push(category);
    } else {
      // Return only the categories that are not the category with the given id
      updatedSelectedCategories = updatedSelectedCategories.filter(
        (category) => category.id != id
      );
    }

    // Update external state
    const updatedSelectedCuisines = mapCategoriesToCuisines()(
      updatedSelectedCategories
    );
    onSelectedCuisinesUpdate(updatedSelectedCuisines);
  };

  // Convenience
  const hasCategories = (): boolean => sortedAndFilteredCategories.length > 0;

  const categories = useMemo((): Category[] => {
    return cuisineData.map((cuisine) => {
      return {
        ...cuisine,
        title: cuisine.localizedNames.en,
      };
    });
  }, [cuisineData]);

  const getRandomCategoryTitle = useMemo((): string => {
    return (
      categories[Math.floor(Math.random() * categories.length)]?.title ??
      "What are you looking for?"
    );
  }, [categories]);

  const mapCategoriesToCuisines = useCallback(
    () => (categories: Category[]) => {
      return categories
        .map((category) => {
          return cuisineData.find((cuisine) => cuisine.id == category.id);
        })
        .filter(Boolean) as Cuisine[];
    },
    [cuisineData]
  );

  const mapCuisinesToCategories = useCallback(
    () => (cuisines: Cuisine[]) => {
      return cuisines
        .map((cuisine) => {
          return categories.find((category) => category.id == cuisine.id);
        })
        .filter(Boolean) as Category[];
    },
    [categories]
  );

  const sortedAndFilteredCategories = useMemo(() => {
    return categories
      .sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { ignorePunctuation: true })
      )
      .filter((category) => {
        return category.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [categories, searchQuery]);

  const selectedCategories = useMemo(() => {
    return mapCuisinesToCategories()(selectedCuisines);
  }, [mapCuisinesToCategories, selectedCuisines]);

  // Subcomponents
  const NoResultsPrompt = (): React.ReactNode => {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <p className="text-permanent_white font-normal shrink-0 text-[18px]">
          No Results Available
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-[16px] transition-all ease-in-out">
      <CategorySelectorSearchBar
        placeholder={`Search For ${searchBarPlaceholder}`}
        textInputDidChangeCallback={onSearchQueryUpdateHandler}
      />
      {hasCategories() ? (
        <TPQCategorySelector
          categories={sortedAndFilteredCategories}
          selectedCategories={selectedCategories}
          onSelect={onSelectHandler}
        />
      ) : (
        <NoResultsPrompt />
      )}
    </div>
  );
}
