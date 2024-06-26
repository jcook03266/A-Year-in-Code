// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public protocol FonciiSchema_SelectionSet: ApolloAPI.SelectionSet & ApolloAPI.RootSelectionSet
where Schema == FonciiSchema.SchemaMetadata {}

public protocol FonciiSchema_InlineFragment: ApolloAPI.SelectionSet & ApolloAPI.InlineFragment
where Schema == FonciiSchema.SchemaMetadata {}

public protocol FonciiSchema_MutableSelectionSet: ApolloAPI.MutableRootSelectionSet
where Schema == FonciiSchema.SchemaMetadata {}

public protocol FonciiSchema_MutableInlineFragment: ApolloAPI.MutableSelectionSet & ApolloAPI.InlineFragment
where Schema == FonciiSchema.SchemaMetadata {}

public extension FonciiSchema {
  typealias ID = String

  typealias SelectionSet = FonciiSchema_SelectionSet

  typealias InlineFragment = FonciiSchema_InlineFragment

  typealias MutableSelectionSet = FonciiSchema_MutableSelectionSet

  typealias MutableInlineFragment = FonciiSchema_MutableInlineFragment

  enum SchemaMetadata: ApolloAPI.SchemaMetadata {
    public static let configuration: ApolloAPI.SchemaConfiguration.Type = SchemaConfiguration.self

    public static func objectType(forTypename typename: String) -> Object? {
      switch typename {
      case "Query": return FonciiSchema.Objects.Query
      case "MealType": return FonciiSchema.Objects.MealType
      case "SupportedLocalizations": return FonciiSchema.Objects.SupportedLocalizations
      case "FoodRestriction": return FonciiSchema.Objects.FoodRestriction
      case "Cuisine": return FonciiSchema.Objects.Cuisine
      case "MajorCity": return FonciiSchema.Objects.MajorCity
      case "Mutation": return FonciiSchema.Objects.Mutation
      case "GenericMutationResponse": return FonciiSchema.Objects.GenericMutationResponse
      case "ClientError": return FonciiSchema.Objects.ClientError
      case "User": return FonciiSchema.Objects.User
      case "ProfileTask": return FonciiSchema.Objects.ProfileTask
      case "Restaurant": return FonciiSchema.Objects.Restaurant
      case "RestaurantAggregationResponse": return FonciiSchema.Objects.RestaurantAggregationResponse
      case "SetTasteProfileResponse": return FonciiSchema.Objects.SetTasteProfileResponse
      case "TasteProfile": return FonciiSchema.Objects.TasteProfile
      case "FavoritedRestaurant": return FonciiSchema.Objects.FavoritedRestaurant
      case "PersonalizedRestaurant": return FonciiSchema.Objects.PersonalizedRestaurant
      case "OperatingHours": return FonciiSchema.Objects.OperatingHours
      case "CoordinatePoint": return FonciiSchema.Objects.CoordinatePoint
      case "GoogleRestaurantProperties": return FonciiSchema.Objects.GoogleRestaurantProperties
      case "YelpRestaurantProperties": return FonciiSchema.Objects.YelpRestaurantProperties
      case "AddressProperties": return FonciiSchema.Objects.AddressProperties
      case "UserNotificationPreferenceUpdateResponse": return FonciiSchema.Objects.UserNotificationPreferenceUpdateResponse
      case "CreateUserResponse": return FonciiSchema.Objects.CreateUserResponse
      case "FavoritedRestaurantResponse": return FonciiSchema.Objects.FavoritedRestaurantResponse
      case "PersonalizedRestaurantSearchResult": return FonciiSchema.Objects.PersonalizedRestaurantSearchResult
      default: return nil
      }
    }
  }

  enum Objects {}
  enum Interfaces {}
  enum Unions {}

}