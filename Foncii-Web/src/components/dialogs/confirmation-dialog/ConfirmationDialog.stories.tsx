// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import ConfirmationDialog from "./ConfirmationDialog";

// Component Story
export default {
  title: "Dialogs/Confirmation Dialog",
  //👇 Enables auto-generated documentation for the component story
  tags: ["autodocs"],
  component: ConfirmationDialog,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <ConfirmationDialog {...args} />;

export const Default = Template.bind({});
export const Destructive = Template.bind({});

Default.args = {
  confirmationDialogTemplate: {
    title: "Test Confirmation",
    message: "Are you sure you want to accept this dialog?",
    onCancel: () => console.log("Cancel Button Pressed"),
    onConfirm: () => console.log("Confirm Button Pressed"),
  },
  isDisplayed: true,
};

Destructive.args = {
  confirmationDialogTemplate: {
    title: "Delete Everything!",
    message: "Are you sure you want to accept this dialog?",
    onCancel: () => console.log("Cancel Button Pressed"),
    onConfirm: () => console.log("Confirm Button Pressed"),
    isDestructive: true,
  },
  isDisplayed: true,
};
