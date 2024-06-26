// Dependencies
import { Meta, StoryFn } from "@storybook/react";

// Imports
import FormInputTextField from "./FormInputTextField";

// Component Story
export default {
  title: "Inputs/Form Input Text Field",
  tags: ["autodocs"],
  component: FormInputTextField,
} as Meta;

// Component Template
const Template: StoryFn = (args: any) => <FormInputTextField {...args} />;

export const Default = Template.bind({});

Default.args = {
  placeholder: "Username, email, or phone number",
};
