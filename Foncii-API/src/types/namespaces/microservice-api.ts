// Various type definitions used for interfacing with proprietary Foncii Microservices
/** Supported Platforms, allows one endpoint to serve users of different Foncii platforms */
export enum SupportedFonciiPlatforms {
  foncii = "FONCII",
  fonciiBiz = "FONCII-BIZ",
}

// Attributes that describe the expected key value JSON output of each endpoint
export enum SentimentAnalysisServiceResponseKeys {
  SentimentScore = "Sentiment Score",
  AverageSentimentScore = "Average Sentiment Score",
}

export declare namespace SentimentAnalysisServiceTypes {
  /// Expected integer values for the sentiment score from 1 - 5
  type SentimentScore = 1 | 2 | 3 | 4 | 5;
}
