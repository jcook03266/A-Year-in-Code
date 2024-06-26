// Dependencies
// Types
import { Metadata } from "next";

// Components
import RestaurantDetailContext from "../../../../../components/panels/gallery-panel/gallery-contexts/restaurant-entity-detail-contexts/restaurant-detail-context/RestaurantDetailContext";

// Meta Tag Generators
import { restaurantDetailViewMetaTagGenerator } from "../../../../../repositories/meta-data-generators";

// Dynamic Metadata
export async function generateMetadata({
  params,
}: {
  params: { restaurantID: string };
}): Promise<Metadata> {
  return restaurantDetailViewMetaTagGenerator({ params });
}

export default function RestaurantDetailViewPage({
  params,
}: {
  params: { restaurantID: string };
}) {
  // Parsing URL Slug Dynamic Route
  const detailViewFonciiRestaurantID = params.restaurantID;

  return (
    <main>
      <RestaurantDetailContext
        fonciiRestaurantID={detailViewFonciiRestaurantID}
        isPresentedModally={false}
      />
    </main>
  );
}
