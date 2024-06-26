// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class AddressProperties: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.AddressProperties
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<AddressProperties>>

  public struct MockFields {
    @Field<String>("city") public var city
    @Field<String>("countryCode") public var countryCode
    @Field<String>("formattedAddress") public var formattedAddress
    @Field<String>("stateCode") public var stateCode
    @Field<String>("streetAddress") public var streetAddress
    @Field<String>("zipCode") public var zipCode
  }
}

public extension Mock where O == AddressProperties {
  convenience init(
    city: String? = nil,
    countryCode: String? = nil,
    formattedAddress: String? = nil,
    stateCode: String? = nil,
    streetAddress: String? = nil,
    zipCode: String? = nil
  ) {
    self.init()
    self.city = city
    self.countryCode = countryCode
    self.formattedAddress = formattedAddress
    self.stateCode = stateCode
    self.streetAddress = streetAddress
    self.zipCode = zipCode
  }
}
