// Dependencies
// Types
import { google } from "@google-cloud/pubsub/build/protos/protos";

// Google PubSub
import {
  CreateSubscriptionOptions,
  Message,
  PubSub,
  Subscription,
} from "@google-cloud/pubsub";
import { PubSubEngine } from "graphql-subscriptions";

// GraphQL Subscriptions - Async Iterator
import { PubSubAsyncIterator } from "./protocols/asyncIterator";

// Logging
import logger from "../../../foncii-toolkit/debugging/debugLogger";

// Types
/**
 * An object that represents a pool of subscription connections to a specific topic,
 * with each subscription being identified by a subscription ID.
 */
type TopicSubscriptionPool = {
  /** A reference to the subscription itself */
  subscription: Subscription;
  /** The name of the topic that this subscription pool is associated with. */
  topicName: string;
  /** An array (pool) of IDs indicating the different connections that are currently connected to the subscription referenced by this pool. */
  connectionIDs: Array<number>;

  // Message event handlers
  messageHandler: (...args: any[]) => void;
  errorHandler: (...args: any[]) => void;
};

/**
 * @param options -> Optional subscription creation options such as time to live (TTL) and or filter properties to filter
 * messages by certain attributes, this is explained more below.
 * @param subject -> Optional secondary key / sub-topic aka subject to use when specific subscriptions are required ~ for instance
 * say you want a subscription to notificatinos for a specific user, you specify the user's ID as
 * the subject to obtain an exclusive subscription, but this is not how you filter the event stream, no,
 * you must also specify a filter for messages that only contain the attribute with the target user's
 * information. That filter is exclusive to this subscription alone; filtering like this with subscriptions
 * that multiple instances rely on is not possible, instead a personal subscription is required to ensure the
 * exclusive contents of the subscription are passed along to the right user.
 */
export type SubscriptionOptions = {
  subCreationOptions?: CreateSubscriptionOptions;
  subject?: string;
};
export type SubscriptionNameGenerator = (
  topic: string,
  subscriptionOptions?: SubscriptionOptions
) => string;
export type CommonMessageProcessor = (message: Message) => Promise<Message>;
export type PubSubPayload = {
  data: any;
  attributes?: { [key: string]: string } | undefined;
};

// Error Coding
class SubscriptionDoesNotExistError extends Error {
  constructor(connectionID: number) {
    super(
      `There is no subscription available for a connection with the ID: "${connectionID}"`
    );
  }
}

/**
 * A stream processing service layer suitable for asynchronously publishing
 * new 'messages' and subscribing to topics via Google PubSub.
 *
 * Note: It's important to expire subscription connections, make sure these
 * aren't persisted when they're no longer needed. Call unsubscribe when
 * done with a subscription.
 */
export default class PubSubService implements PubSubEngine {
  // IAM
  private static serviceAccount = JSON.parse(
    process.env.FONCII_APP_ADMIN_SDK_CERT_SECRET
  );
  private static projectID = PubSubService.serviceAccount["project_id"];

  // Singleton
  static shared: PubSubService = new PubSubService();

  // Properties
  // Configurable pipeline for handling messages, call `setCommonMessageHandler` to configure this handler
  private messageProcessor: CommonMessageProcessor = async (message: Message) =>
    message;
  private pubSubClient: PubSub;

  // Limits
  // In seconds [s], for dynamically created subscriptions
  private defaultMaxSubscriptionTTL: google.protobuf.Duration =
    new google.protobuf.Duration({ seconds: 60 * 30 }); // 30 Minutes

  // Callbacks
  private messageHandlers: { [clientID: number]: [string, Function] } = {};

  // Subscriptions
  public topicSubscriptionPools: {
    [topicSubscriptionName: string]: TopicSubscriptionPool;
  } = {};
  public subscriptionCounter: number = 0;

  // Convenience
  /**
   * Generates a dynamic subscription name using the given topic name
   * which will then be used to create a subscription for that topic
   * remotely and be used to track existing connections to manage
   * lifecycles for locally.
   */
  private generateSubscriptionNameForTopic: SubscriptionNameGenerator = (
    topicName,
    options
  ) =>
    `${topicName}-${
      options?.subject ? options.subject + "-" : undefined
    }subscription`;

  constructor() {
    this.pubSubClient = new PubSub({
      projectId: PubSubService.projectID,
      credentials: {
        ...PubSubService.serviceAccount,
      },
    });
  }

  // Configuration
  /**
   * Use this if you need to sync or async pre-process the contents of the
   *  message before letting it be resolved by the message handler.
   *
   * @param messageProcessor
   */
  public setMessageProcessor(processor: CommonMessageProcessor) {
    this.messageProcessor = processor;
  }

  // Business Logic
  public async publish(
    triggerName: string,
    payload: PubSubPayload
  ): Promise<void> {
    // Parsing
    const topicName = triggerName,
      { data, attributes } = payload;

    // Message payload pre-processing
    let parsedData = data;

    // Stringify data
    if (typeof payload !== "string") {
      parsedData = JSON.stringify(data);
    }

    await this.pubSubClient
      .topic(topicName)
      .publishMessage({ data: Buffer.from(parsedData), attributes });

    // Return void to fulfill protocol requirements
    return Promise.resolve();
  }

  /**
   * Fetches or creates a new subscription for the given topic with
   * the specified `options: CreateSubscriptionOptions` parameter (if any).
   *
   * @async
   * @param topicName -> Name of the topic ~ ex.) notifications
   * @param topicSubscriptionName -> Name of the subscription for the target topic (usually generated using topic2SubName) ~ ex.) notifications-subscription
   * @param options -> Options to pass to the subscription creator when creating a new
   * subscription (when one doesn't exist locally already) ~ Filtering options, you can
   * filter out messages based on a filter you provide using attributes or anything else
   * specific to the current use case.
   *
   * @returns -> A subscription response if the subscription was just created
   * or an existing subscription if the subscription is stored locally.
   */
  private async getSubscription(
    topicName: any,
    topicSubscriptionName: string,
    options: SubscriptionOptions
  ) {
    const sub = this.pubSubClient.subscription(topicSubscriptionName),
      [exists] = await sub.exists();

    if (exists) return sub;
    else {
      // Parsing
      const { subCreationOptions } = options;

      const newSub = this.pubSubClient
        .topic(topicName)
        .createSubscription(topicSubscriptionName, {
          ...(subCreationOptions ?? {}),
          expirationPolicy: { ttl: this.defaultMaxSubscriptionTTL },
        });

      return newSub;
    }
  }

  /**
   * Creates a new subscription connection to the target topic using the
   * provided options and onMessage callback parameters. This connection
   * is persisted in a pool alongside other connections to the topic subscription.
   *
   * @async
   * @param triggerName -> Pubsub topic
   * @param onMessage -> Callback function for when the message is resolved
   * @param options -> Options to pass to the subscription creator when creating a new
   * subscription (when one doesn't exist locally already) ~ Filtering options, you can
   * filter out messages based on a filter you provide using attributes or anything else
   * specific to the current use case.
   *
   * @returns -> The ID of a new connection to a subscription for the given
   * trigger name / pubsub topic
   */
  public async subscribe(
    triggerName: string,
    onMessage: (message: Message) => void,
    options: SubscriptionOptions
  ): Promise<number> {
    // Conversion
    const topicName = triggerName,
      topicSubscriptionName = this.generateSubscriptionNameForTopic(
        topicName,
        options
      ),
      // Generate a new id that doesn't collide with any old subscription IDs based on this object's global state
      id = this.subscriptionCounter++;

    // Setup callback for this connection
    this.messageHandlers[id] = [topicSubscriptionName, onMessage];

    // Append the new connection id.
    const { connectionIDs: existingConnectionIDs = [], ...props } =
      this.topicSubscriptionPools[topicSubscriptionName] || {};
    this.topicSubscriptionPools[topicSubscriptionName] = {
      ...props,
      connectionIDs: [...existingConnectionIDs, id],
    };

    // A subscription for this pool exists already. Return the id of the new connection
    if (existingConnectionIDs.length > 0) return Promise.resolve(id);

    // No subscription exists for this topic subscription pool, fetch or create one
    const subscription = (await this.getSubscription(
        topicName,
        topicSubscriptionName,
        options
      )) as Subscription,
      topicSubscriptionPool =
        this.topicSubscriptionPools[topicSubscriptionName] || {};

    // All connections have unsubscribed before the new subscription was created, return the connection ID
    if (!topicSubscriptionPool?.connectionIDs.length) return id;
    else {
      // Create a new pool for subscriptions to the given topic
      const messageHandler = this.getMessageHandler(topicSubscriptionName),
        errorHandler = (error: any) => logger.error(error);

      // Attach event listeners
      subscription.on("message", messageHandler);
      subscription.on("error", errorHandler);

      this.topicSubscriptionPools[topicSubscriptionName] = {
        ...topicSubscriptionPool,
        topicName,
        messageHandler,
        errorHandler,
        subscription,
      };

      return id;
    }
  }

  /**
   * The message handler associated with the given topic subscription name.
   *
   * @param topicSubscriptionName
   *
   * @returns -> Async message handler that executes all message handlers for the
   * pool's various connections via the shared message handlers pool.
   */
  private getMessageHandler(
    topicSubscriptionName: string
  ): (message: Message) => Promise<void> {
    const engine = this;

    async function handleMessage(message: Message) {
      // Acknowledge the message to inform Pub/Sub that the message has been received.
      message.ack();

      const processedMessage = await engine.messageProcessor(message),
        { connectionIDs = [] } =
          engine.topicSubscriptionPools[topicSubscriptionName] || {};

      // Resolve message callbacks for each connection
      connectionIDs.forEach((id) => {
        const [_, onMessage] = engine.messageHandlers[id];
        onMessage(processedMessage);
      });
    }

    // Allow the message handler to use methods from this class through binding
    return handleMessage.bind(this);
  }

  public unsubscribe(connectionID: number) {
    // Parsing
    const [topicSubscriptionName] = this.messageHandlers[connectionID] || [
        undefined,
      ],
      topicSubscriptionPool =
        this.topicSubscriptionPools[topicSubscriptionName] || {},
      { connectionIDs } = topicSubscriptionPool;

    // Error catching
    if (!topicSubscriptionName || !connectionIDs)
      throw new SubscriptionDoesNotExistError(connectionID);

    // If only one connection remains, delete the subscription pool entirely as no connections are dependent on the subscription
    if (connectionIDs.length === 1) {
      // Remove event listeners from subscription and the subscription from the `topicSubscriptionPools` record entirely
      const { subscription, messageHandler, errorHandler } =
        topicSubscriptionPool;

      // Only remove listener if the client didn't unsubscribe before the subscription was created
      if (subscription) {
        subscription.removeListener("message", messageHandler);
        subscription.removeListener("error", errorHandler);
      }

      delete this.topicSubscriptionPools[topicSubscriptionName];
    } else {
      // Remove the given subscription connection ID from list of connection IDs associated with the subscription.
      const index = connectionIDs.indexOf(connectionID);

      this.topicSubscriptionPools[topicSubscriptionName] = {
        ...topicSubscriptionPool,
        connectionIDs:
          index === -1
            ? connectionIDs
            : [...connectionIDs.filter((id) => id != connectionID)],
      };
    }

    // Deallocate message handler callback closure for the target subscription
    delete this.messageHandlers[connectionID];
  }

  /**
   * Unsubscribes all connections from the topic subscription pool
   * associated with the given topicSubscriptionName, (if any).
   *
   * @param topicSubscriptionName
   */
  public unsubscribeAllFrom(topicSubscriptionName: string) {
    const topicSubscriptionPool =
      this.topicSubscriptionPools[topicSubscriptionName];

    if (!topicSubscriptionPool) return;

    // Parsing
    const { subscription, connectionIDs, messageHandler, errorHandler } =
      topicSubscriptionPool;

    // Only remove listener if the client didn't unsubscribe before the subscription was created
    if (subscription) {
      subscription.removeListener("message", messageHandler);
      subscription.removeListener("error", errorHandler);
    }

    // Remove all callbacks from memory
    connectionIDs.forEach((id) => {
      delete this.messageHandlers[id];
    });

    // Remove this subscription pool
    delete this.topicSubscriptionPools[topicSubscriptionName];
  }

  /**
   * Unsubscribes all connections for the given topic for
   * all pools that are associated with the topic.
   *
   * @param topicName
   */
  public unsubscribeAllFromTopic(topicName: string) {
    const subscriptionPoolsForTopic = Object.entries(
      this.topicSubscriptionPools
    ).filter(([_, pool]) => pool.topicName == topicName);

    subscriptionPoolsForTopic.forEach(([subscriptionTopicName, _]) => {
      this.unsubscribeAllFrom(subscriptionTopicName);
    });
  }

  /**
   * Removes all subscriptions
   */
  public unsubscribeAll() {
    Object.entries(this.topicSubscriptionPools).forEach(
      ([
        topicSubscriptionName,
        { subscription, connectionIDs, messageHandler, errorHandler },
      ]) => {
        // Only remove listener if the client didn't unsubscribe before the subscription was created
        if (subscription) {
          subscription.removeListener("message", messageHandler);
          subscription.removeListener("error", errorHandler);
        }

        // Remove all callbacks from memory
        connectionIDs.forEach((id) => {
          delete this.messageHandlers[id];
        });

        // Remove this subscription pool
        delete this.topicSubscriptionPools[topicSubscriptionName];
      }
    );
  }

  public asyncIterator<T>(
    topicNames: string | string[],
    options?: SubscriptionOptions
  ): AsyncIterator<T> {
    return new PubSubAsyncIterator(this, topicNames, options);
  }
}
