// Package Dependencies
// Schema Builder Toolkit
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";

// Modular Type Definitions
import FonciiUserTypeDefs from "./definitions/shared/users/type-defs/fonciiUserTypeDefs";
import FonciiUserQMITypeDefs from "./definitions/shared/users/type-defs/fonciiUserQMITypeDefs";
import UtilityTypeDefs from "../schema/definitions/utilities/type-defs/utilityTypeDefs";
import StaticResourceTypeDefs from "../schema/definitions/shared/static-resources/type-defs/staticResourcesTypeDefs";
import StaticResourceQMITypeDefs from "../schema/definitions/shared/static-resources/type-defs/staticResourcesQMITypeDefs";
import RestaurantTypeDefs from "../schema/definitions/shared/restaurants/type-defs/restaurantTypeDefs";
import RestaurantQMITypeDefs from "../schema/definitions/shared/restaurants/type-defs/restaurantQMITypeDefs";
import FMUserTypeDefs from "./definitions/shared/users/type-defs/fmUserTypeDefs";
import FMUserQMITypeDefs from "./definitions/shared/users/type-defs/fmUserQMITypeDefs";
import FMUserPostTypeDefs from "./definitions/foncii-maps/posts/type-defs/fmUserPostTypeDefs";
import FMUserPostQMITypeDefs from "./definitions/foncii-maps/posts/type-defs/fmUserPostQMITypeDefs";
import EventTypeDefs from "./definitions/shared/events/type-defs/eventTypeDefs";
import EventQMITypeDefs from "./definitions/shared/events/type-defs/eventQMITypeDefs";
import InputTypeDefs from "../schema/definitions/shared/common/type-defs/inputs";
import OutputTypeDefs from "../schema/definitions/shared/common/type-defs/outputs";
import UnionTypeDefs from "../schema/definitions/shared/common/type-defs/unions";
import EnumTypeDefs from "../schema/definitions/shared/common/type-defs/enums";
import InterfaceTypeDefs from "../schema/definitions/shared/common/type-defs/interfaces";
import CommonTypeDefs from "../schema/definitions/shared/common/type-defs/types";
import DirectiveDefs from "../schema/definitions/shared/common/type-defs/directives";

// Modular Resolver Definitions
import RestaurantResolvers from "../schema/definitions/shared/restaurants/resolvers/restaurantResolvers";
import FMUserPostResolvers from "./definitions/foncii-maps/posts/resolvers/fmUserPostResolvers";
import StaticResourceResolvers from "../schema/definitions/shared/static-resources/resolvers/staticResourcesResolvers";
import UserResolvers from "../schema/definitions/shared/users/resolvers/userResolvers";
import EventResolvers from "../schema/definitions/shared/events/resolvers/eventResolvers";

// Merge Type Definitions and Resolvers
const typeDefs = mergeTypeDefs([
  UtilityTypeDefs,
  StaticResourceTypeDefs,
  StaticResourceQMITypeDefs,
  RestaurantTypeDefs,
  RestaurantQMITypeDefs,
  FMUserTypeDefs,
  InputTypeDefs,
  OutputTypeDefs,
  UnionTypeDefs,
  EnumTypeDefs,
  InterfaceTypeDefs,
  CommonTypeDefs,
  DirectiveDefs,
  FMUserQMITypeDefs,
  FMUserPostTypeDefs,
  FMUserPostQMITypeDefs,
  EventTypeDefs,
  EventQMITypeDefs,
  FonciiUserTypeDefs,
  FonciiUserQMITypeDefs,
]);

const resolvers = mergeResolvers([
  RestaurantResolvers,
  FMUserPostResolvers,
  StaticResourceResolvers,
  UserResolvers,
  EventResolvers,
]) as any;

// Create and export the executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}) as any;

export default schema;
