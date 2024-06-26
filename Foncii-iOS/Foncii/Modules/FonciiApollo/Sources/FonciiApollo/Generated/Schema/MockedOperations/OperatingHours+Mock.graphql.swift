// @generated
// This file was automatically generated and should not be edited.

import ApolloTestSupport
import FonciiApollo

public class OperatingHours: MockObject {
  public static let objectType: Object = FonciiSchema.Objects.OperatingHours
  public static let _mockFields = MockFields()
  public typealias MockValueCollectionType = Array<Mock<OperatingHours>>

  public struct MockFields {
    @Field<String>("Friday") public var Friday
    @Field<String>("Monday") public var Monday
    @Field<String>("Saturday") public var Saturday
    @Field<String>("Sunday") public var Sunday
    @Field<String>("Thursday") public var Thursday
    @Field<String>("Tuesday") public var Tuesday
    @Field<String>("Wednesday") public var Wednesday
  }
}

public extension Mock where O == OperatingHours {
  convenience init(
    Friday: String? = nil,
    Monday: String? = nil,
    Saturday: String? = nil,
    Sunday: String? = nil,
    Thursday: String? = nil,
    Tuesday: String? = nil,
    Wednesday: String? = nil
  ) {
    self.init()
    self.Friday = Friday
    self.Monday = Monday
    self.Saturday = Saturday
    self.Sunday = Sunday
    self.Thursday = Thursday
    self.Tuesday = Tuesday
    self.Wednesday = Wednesday
  }
}
