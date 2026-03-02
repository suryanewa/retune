/**
 * Component Registry — Maps UDS component IDs to real React components
 * from @yahoo/uds. These render natively on the canvas.
 */

import type { ComponentType } from "react";

import {
  Button,
  IconButton,
  Link,
  Pressable,
  Input,
  Checkbox,
  Radio,
  Switch,
  Avatar,
  Badge,
  Chip,
  Divider,
  Image,
  Icon,
  Text,
  Box,
} from "@yahoo/uds";

export interface RegisteredComponent {
  component: ComponentType<any>;
  defaultProps: Record<string, any>;
  /** Wrapper component for compound components (e.g. Tooltip needs Trigger + Content) */
  wrapper?: ComponentType<any>;
}

export const componentRegistry: Record<string, RegisteredComponent> = {
  Button: {
    component: Button,
    defaultProps: { children: "Button", variant: "primary", size: "md" },
  },
  IconButton: {
    component: IconButton,
    defaultProps: { accessibilityLabel: "Action" },
  },
  Link: {
    component: Link,
    defaultProps: { children: "Link", href: "#" },
  },
  Pressable: {
    component: Pressable,
    defaultProps: { children: "Pressable" },
  },
  Input: {
    component: Input,
    defaultProps: { placeholder: "Enter text..." },
  },
  Checkbox: {
    component: Checkbox,
    defaultProps: { label: "Checkbox" },
  },
  Radio: {
    component: Radio,
    defaultProps: { label: "Radio", value: "option" },
  },
  Switch: {
    component: Switch,
    defaultProps: { label: "Switch" },
  },
  Avatar: {
    component: Avatar,
    defaultProps: { size: "md" },
  },
  Badge: {
    component: Badge,
    defaultProps: { children: "Badge" },
  },
  Chip: {
    component: Chip,
    defaultProps: { children: "Chip" },
  },
  Divider: {
    component: Divider,
    defaultProps: {},
  },
  Image: {
    component: Image,
    defaultProps: { src: "", alt: "Image" },
  },
  Icon: {
    component: Icon,
    defaultProps: { size: "md" },
  },
  Text: {
    component: Text,
    defaultProps: { children: "Text", variant: "body1" },
  },
  Box: {
    component: Box,
    defaultProps: {},
  },
};
