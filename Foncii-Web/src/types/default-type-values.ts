const defaultReservationDate = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime();
};

// Default Value For Post Filter Objects
export const DefaultPostFilters: PostFilters = {
  priceLevels: [],
  cuisineTypes: [],
  customCategories: [],
  creatorUIDs: [],
  publications: [],
  restaurantAwards: [],
  mealTypes: [],
  yelpRating: 0,
  googleRating: 0,
  creatorRating: 0,
  dateRange: [new Date().getTime(), new Date().getTime()],
  newestToOldestSort: false,
  closestToFarthestSort: false,
  showFavoritesOnly: false,
  openNowOnly: false,
  trendingSort: false,
  qualitySort: false,
  percentMatchSort: true,

  // Reservation Criteria
  reservableOnly: false,
  targetReservationDate: defaultReservationDate(),
  targetReservationPartySize: 2,
};
