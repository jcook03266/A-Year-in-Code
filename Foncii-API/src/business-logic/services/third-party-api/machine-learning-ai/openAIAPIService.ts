// Dependencies
// Types
import { Double } from "mongodb";

// SDK
import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Simple interface class for utilizing Open AI's various
 * utilities, services, and APIs.
 */
export default class OpenAIAPIService {
  // Properties
  private textEmbeddingModel: OpenAIEmbeddings;

  constructor() {
    this.textEmbeddingModel = this.generateTextEmbeddingModel();
  }

  // Setup
  private generateTextEmbeddingModel() {
    // Properties
    const batchSize = 512,
      // Must match the comparison vectors' length
      dimensions = 2048,
      modelName = "text-embedding-3-large";

    return new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_AI_SECRET,
      batchSize, // Default value if omitted is 512. Max is 2048
      modelName,
      dimensions,
    });
  }

  // Business Logic
  /**
   * Generates an embedding for a single document / text query.
   * Important: The length of the output vector is 2048 dimensions.
   * Vector search requires compared vectors to be the same dimensions.
   *
   * Note: Doubles are required by Mongo for vector search, that's why the conversion
   * happens here.
   *
   * @async
   * @param textQuery -> The query to vectorize into an embedding
   *
   * @returns -> A vector embedding (array of numbers / doubles) for the document / query provided.
   */
  async embedTextQuery(textQuery: string): Promise<Double[]> {
    return (await this.textEmbeddingModel.embedQuery(textQuery)).map(
      (val) => new Double(val)
    );
  }
}
