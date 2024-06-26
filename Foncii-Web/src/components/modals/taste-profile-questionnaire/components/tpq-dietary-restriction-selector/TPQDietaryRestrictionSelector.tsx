/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { DietaryRestriction } from "../../../../../__generated__/graphql";

// Hooks
import { useCallback, useEffect, useMemo, useState } from "react";

// Components
import CategorySelectorSearchBar from "../tpq-category-selector/components/search-bar/CategorySelectorSearchBar";
import TPQCategorySelector, {
  Category,
} from "../tpq-category-selector/TPQCategorySelector";

interface TPQDietaryRestrictionSelectorProps {
  dietaryRestrictionData: DietaryRestriction[];
  selectedDietaryRestrictions: DietaryRestriction[];
  onSelectedDietaryRestrictionsUpdate: (
    dietaryRestrictions: DietaryRestriction[]
  ) => void;
}

export default function TPQDietaryRestrictionSelector({
  dietaryRestrictionData,
  selectedDietaryRestrictions,
  onSelectedDietaryRestrictionsUpdate,
}: TPQDietaryRestrictionSelectorProps) {
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
    let updatedSelectedCategories = mapDietaryRestrictionsToCategories()(
      selectedDietaryRestrictions
    );

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
    const updatedSelectedDietaryRestrictions =
      mapCategoriesToDietaryRestrictions()(updatedSelectedCategories);
    onSelectedDietaryRestrictionsUpdate(updatedSelectedDietaryRestrictions);
  };

  // Convenience
  const hasCategories = (): boolean => sortedAndFilteredCategories.length > 0;

  const categories = useMemo((): Category[] => {
    return dietaryRestrictionData.map((dietaryRestriction) => {
      return {
        ...dietaryRestriction,
        title: dietaryRestriction.localizedNames.en,
      };
    });
  }, [dietaryRestrictionData]);

  const getRandomCategoryTitle = useMemo((): string => {
    return (
      categories[Math.floor(Math.random() * categories.length)]?.title ??
      "What are you looking for?"
    );
  }, [categories]);

  const mapCategoriesToDietaryRestrictions = useCallback(
    () => (categories: Category[]) => {
      return categories
        .map((category) => {
          return dietaryRestrictionData.find(
            (dietaryRestriction) => dietaryRestriction.id == category.id
          );
        })
        .filter(Boolean) as DietaryRestriction[];
    },
    [dietaryRestrictionData]
  );

  const mapDietaryRestrictionsToCategories = useCallback(
    () => (dietaryRestrictions: DietaryRestriction[]) => {
      return dietaryRestrictions
        .map((dietaryRestriction) => {
          return categories.find(
            (category) => category.id == dietaryRestriction.id
          );
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
    return mapDietaryRestrictionsToCategories()(selectedDietaryRestrictions);
  }, [mapDietaryRestrictionsToCategories, selectedDietaryRestrictions]);

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
