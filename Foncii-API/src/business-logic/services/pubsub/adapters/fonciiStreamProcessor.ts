// Dependencies
// Types
import { Message } from "@google-cloud/pubsub";

// Services
import PubSubService, {
  CommonMessageProcessor,
  PubSubPayload,
  SubscriptionOptions,
} from "../pubSubService";

// Types
export enum FonciiTopics {
  notifications = "notifications",
}

/**
 * Simple interface for the PubSub engine using expected topic names
 * and other useful high level functionalities to enhance and simplify the stream
 * processing experience across this server.
 */
export default class FonciiStreamProcessor {
  // Convenience
  public totalLifetimeSubscriptionConnections = () =>
    PubSubService.shared.subscriptionCounter;
  public totalActiveSubscriptionPools = () =>
    Object.keys(PubSubService.shared.topicSubscriptionPools).length;

  // Getters
  public getSubscriptionPoolForTopic = (topic: FonciiTopics) =>
    Object.values(PubSubService.shared.topicSubscriptionPools).filter(
      (pool) => pool.topicName == topic
    );
  public getSubscriptionPoolForConnectionID = (connectionID: number) =>
    Object.values(PubSubService.shared.topicSubscriptionPools).filter((pool) =>
      pool.connectionIDs.includes(connectionID)
    );
  public getAsyncIteratorForTopic = (topic: FonciiTopics) =>
    PubSubService.shared.asyncIterator(topic);

  // Filter Factory
  /**
   * @param filters
   * @returns -> A filter to be used to filter incoming messages with
   */
  constructMessageFilter(filters: { [attributeName: string]: any }) {
    return filters;
  }

  // Configuration
  /**
   * Use this if you need to sync or async pre-process the contents of the
   *  message before letting it be resolved by the message handler.
   *
   * @param messageProcessor
   */
  setMessageProcessor(messageProcessor: CommonMessageProcessor) {
    PubSubService.shared.setMessageProcessor(messageProcessor);
  }

  // Business Logic
  public async subscribeTo({
    topic,
    messageHandler,
    options,
  }: {
    topic: FonciiTopics;
    messageHandler: (message: Message) => void;
    options?: SubscriptionOptions;
  }): Promise<number> {
    return await PubSubService.shared.subscribe(
      topic,
      messageHandler,
      options ?? {}
    );
  }

  async unsubscribeConnection(connectionID: number) {
    PubSubService.shared.unsubscribe(connectionID);
  }

  async unsubscribeFromTopic(topic: FonciiTopics) {
    PubSubService.shared.unsubscribeAllFromTopic(topic);
  }

  async unsubscribeFromAll() {
    PubSubService.shared.unsubscribeAll();
  }

  public async publishTo({
    topic,
    payload,
  }: {
    topic: FonciiTopics;
    payload: PubSubPayload;
  }) {
    await PubSubService.shared.publish(topic, payload);
  }
}
