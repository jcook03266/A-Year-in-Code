// Dependencies
// Types
import { Metadata } from "next";

// Components
import PostDetailContext from "../../../../../../../components/panels/gallery-panel/gallery-contexts/restaurant-entity-detail-contexts/post-detail-context/PostDetailContext";

// Meta Tag Generators
import { postDetailViewMetaTagGenerator } from "../../../../../../../repositories/meta-data-generators";

// Dynamic Metadata
export async function generateMetadata({
  params,
}: {
  params: { postID: string };
}): Promise<Metadata> {
  return postDetailViewMetaTagGenerator({ params });
}

export default function PostDetailViewPage({
  params,
}: {
  params: { postID: string };
}) {
  // Parsing URL Slug Dynamic Route
  const detailViewPostID = params.postID;

  return (
    <main>
      <PostDetailContext postID={detailViewPostID} isPresentedModally={false} />
    </main>
  );
}
