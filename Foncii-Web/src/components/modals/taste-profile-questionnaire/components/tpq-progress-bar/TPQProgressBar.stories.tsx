// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import TPQProgressBar from "./TPQProgressBar";

// Component Story
export default {
  title:
    "Modals/Taste Profile Questionnaire/Components/Taste Profile Questionnaire Progress Bar",
  tags: ["autodocs"],
  component: TPQProgressBar,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <TPQProgressBar {...args} />;

export const Default = Template.bind({});
export const WithPages = Template.bind({});
export const CompletedPages = Template.bind({});
export const AllCompletedPages = Template.bind({});

Default.args = {
  currentPageIndex: 0,
  pageCount: 8,
  onPageIndicatorClick: (pageIndex: number) => {
    console.log(`[TPQProgressBar] Page Index ${pageIndex} clicked.`);
  },
};

WithPages.args = {
  currentPageIndex: 1,
  pageCount: 8,
  onPageIndicatorClick: (pageIndex: number) => {
    console.log(`[TPQProgressBar] Page Index ${pageIndex} clicked.`);
  },
};

CompletedPages.args = {
  currentPageIndex: 5,
  pageCount: 8,
  completedPagesIndices: [0, 1, 2, 3, 4, 5],
  onPageIndicatorClick: (pageIndex: number) => {
    console.log(`[TPQProgressBar] Page Index ${pageIndex} clicked.`);
  },
};

AllCompletedPages.args = {
  currentPageIndex: 7,
  pageCount: 8,
  completedPagesIndices: [0, 1, 2, 3, 4, 5, 6, 7],
  onPageIndicatorClick: (pageIndex: number) => {
    console.log(`[TPQProgressBar] Page Index ${pageIndex} clicked.`);
  },
};
