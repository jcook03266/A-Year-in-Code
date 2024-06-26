// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Mock Data
import {
  ConfigurableMockFMPostDataWRestaurantData,
  MockFMPostData,
} from "../../../types/mocks/mock-gql-types";

// Imports
import GalleryPostCard from "./GalleryPostCard";

// Component Story
export default {
  title: "Restaurant Entities/Gallery Page/Gallery Post Card",
  tags: ["autodocs"],
  component: GalleryPostCard,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <GalleryPostCard {...args} />;

export const MissingRestaurant = Template.bind({});
export const WithRestaurant = Template.bind({});

MissingRestaurant.args = {
  post: MockFMPostData,
};

WithRestaurant.args = {
  post: ConfigurableMockFMPostDataWRestaurantData(),
};
