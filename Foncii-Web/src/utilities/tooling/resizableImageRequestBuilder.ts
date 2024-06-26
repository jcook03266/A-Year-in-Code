// Dependencies
// Types
import {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
  MediaServerResizingParams,
} from "../../services/media/service-adapters/cloudStorageServiceAdapter";

// Constants
const FONCII_CDN_ORIGIN = "https://cdn.foncii.com/";

/** Generic interface for specifying height and width parameters for resizable images */
export interface ResizableImageDimensions {
  width: number;
  height: number;
}

/**
 * Props expected by the media service when requesting to resize an image
 */
export interface ResizableImageRequestProps extends ResizableImageDimensions {
  fit?: MediaServerImageFitParams | string;
  format?: MediaServerImageFormatParams | string;
  quality?: number;
}

export interface ResizableGoogleImageRequestProps
  extends ResizableImageDimensions {}

/**
 * Various supported Yelp image sizes
 * Reference: https://stackoverflow.com/questions/17965691/yelp-api-ios-getting-a-larger-image
 */
export enum YelpImageSizes {
  /** up to 40×40 */
  small = "s",
  /** 40×40 square */
  smallSquare = "ss",
  /** up to 100×100 */
  medium = "m",
  /** 100×100 square */
  mediumSquare = "ms",
  /** Up to 600×400 */
  large = "l",
  /** 250×250 square */
  largeSquare = "ls",
  /** up to 1000×1000 */
  original = "o",
  /** 348×348 square */
  square348 = "348s",
}

// Foncii Resizing
/**
 * @param imageURL
 *
 * @returns -> True if the image specified by the given URL string is resizable
 * (hosted by Foncii), false otherwise.
 */
function isImageResizableByFoncii(imageURL: string) {
  return imageURL.includes(FONCII_CDN_ORIGIN);
}

/**
 * Transforms the input image URL into a parameterized version that the media server will understand and use
 * to transform, process, and serve the image back to the client in the expected form requested.
 *
 * @param baseImageURL -> The input URL to parameterize
 * @param imageResizingProps -> {
 * @param height -> The desired size of the image (takes priority if width isn't provided and if the fit is cover or outside etc.)
 * @param width -> (Required for client image component, must be specified) | optional width parameter to specify, if not provided height takes priority automatically
 * @param fit -> Optional parameters to include to inform the server of how the resized
 * image should fit within its new dimensions. Defaults to outside if none provided (outside gives priority to the height
 * and preserves the image aspect ratio since height / size is always defined)
 * @param format -> Optional format parameter to include if converting the image to a different format is desired.
 * @param quality -> Optional quality parameter to specify to reduce preserve the quality of the image when converting it to
 * a different format. Default is 100 (full quality)
 * }
 *
 * example:
 * For encoded and non-encoded URLs:
 * ```
 * https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA -> https://cdn.foncii.com/Zm9uY2lpLW1hcHMvbWVkaWEvdXNlci1nZW5lcmF0ZWQtbWVkaWEvMjJ4NDBlNFo3SVkwRlR5c0tnbDIvcG9zdHMvMm5mQTY4ZkJacnRYWmJQYmxGbzA=h1600-w1200
 * https://cdn.foncii.com/foncii-maps/media/user-generated-media/22x40e4Z7IY0FTysKgl2/posts/2nfA68fBZrtXZbPblFo0 -> https://cdn.foncii.com/foncii-maps/media/user-generated-media/22x40e4Z7IY0FTysKgl2/posts/2nfA68fBZrtXZbPblFo0=h1600-w1200
 * ```
 *
 * @returns -> A constructed resizable image request URL to pass to the foncii media server endpoint which will generate the requested image
 * with the specified parameters, which is then cached by the CDN so that the media server doesn't have to generate it again until the cache is
 * invalidated.
 */
export function resizableImageRequestBuilder({
  baseImageURL,
  imageResizingProps,
}: {
  baseImageURL: string;
  imageResizingProps: ResizableImageRequestProps;
}) {
  // Precondition failure, return the default image URL if it's not resizable by the Foncii media service
  if (!isImageResizableByFoncii(baseImageURL)) return baseImageURL;

  // Parsing
  const { height, width, fit, format, quality } = imageResizingProps;

  // Set params
  const params = [];

  // Height param
  params.push(
    joinParameterKeyWithValue({
      key: MediaServerResizingParams.height,
      value: height,
    })
  );

  // Width param
  if (width)
    params.push(
      joinParameterKeyWithValue({
        key: MediaServerResizingParams.width,
        value: width,
      })
    );

  // Fit param
  if (fit)
    params.push(
      joinParameterKeyWithValue({
        key: MediaServerResizingParams.fit,
        value: fit,
      })
    );

  // Format param
  if (format)
    params.push(
      joinParameterKeyWithValue({
        key: MediaServerResizingParams.format,
        value: format,
      })
    );

  // Quality param
  if (quality)
    params.push(
      joinParameterKeyWithValue({
        key: MediaServerResizingParams.quality,
        value: quality,
      })
    );

  // Link the params together: Ex.) h100-w100....
  const parameterString = params.join("-");

  // (baseImageURL)=h100-w100...
  return [baseImageURL, parameterString].join("=");
}

function joinParameterKeyWithValue({
  key,
  value,
}: {
  key: MediaServerResizingParams | string;
  value: string | number;
}) {
  return key + String(value);
}

// Google Resizing (Temporary until we migrate)
/**
 * @param imageURL
 *
 * @returns -> True if the image specified by the given URL string is resizable
 * (hosted by Google (Google Places)), false otherwise.
 */
function isImageResizableByGoogle(imageURL: string) {
  return imageURL.includes("https://lh3.googleusercontent.com/places/");
}

/**
 * ex.) https://lh3.googleusercontent.com/places/ANXAkqEEuKe04gd_EQYgwWRlCJZfB9QXHiUorg4oBL7ITYiDsHEHK7Lhe9fXP-UBpNFQXTXbK8Eh5B2WhUNc4T6koBa5pQRbzvGDwAI=s1600-w1200 -> https://lh3.googleusercontent.com/places/ANXAkqEEuKe04gd_EQYgwWRlCJZfB9QXHiUorg4oBL7ITYiDsHEHK7Lhe9fXP-UBpNFQXTXbK8Eh5B2WhUNc4T6koBa5pQRbzvGDwAI=s400-w400
 */
function resizableGoogleImageRequestBuilder({
  imageURL,
  imageResizingProps,
}: {
  imageURL: string;
  imageResizingProps: ResizableGoogleImageRequestProps;
}) {
  // Precondition failure, return the default image URL if it's not resizable by Google's API
  if (!isImageResizableByGoogle(imageURL)) return imageURL;

  // Parsing
  const { height, width } = imageResizingProps;

  // Google resizing keys | Just need these for now, there are other parameters but these are good enough
  const SIZE_KEY = "s",
    WIDTH_KEY = "w";

  // Set params
  const params = [];

  // Height / size param
  params.push(joinParameterKeyWithValue({ key: SIZE_KEY, value: height }));

  // Width param (optional)
  if (width)
    params.push(joinParameterKeyWithValue({ key: WIDTH_KEY, value: width }));

  // Link the params together: Ex.) s100-w100....
  const parameterString = params.join("-"),
    strippedImageURL = imageURL.split("=")[0];

  // (strippedImageURL)=s100-w100...
  return [strippedImageURL, parameterString].join("=");
}

// Yelp Resizing (Temporary until we migrate)
/**
 * @param imageURL
 *
 * @returns -> True if the image specified by the given URL string is resizable
 * (hosted by Yelp (Yelp Fusion)), false otherwise.
 */
function isImageResizableByYelp(imageURL: string) {
  return imageURL.includes("https://s3-media4.fl.yelpcdn.com/");
}

function convertYelpImageSizeIntoDimensions(
  size: YelpImageSizes
): ResizableImageDimensions {
  switch (size) {
    case YelpImageSizes.small:
      return { height: 40, width: 40 };
    case YelpImageSizes.smallSquare:
      return { height: 40, width: 40 };
    case YelpImageSizes.medium:
      return { height: 100, width: 100 };
    case YelpImageSizes.mediumSquare:
      return { height: 100, width: 100 };
    case YelpImageSizes.large:
      return { height: 600, width: 400 };
    case YelpImageSizes.largeSquare:
      return { height: 250, width: 250 };
    case YelpImageSizes.original:
      return { height: 1000, width: 1000 };
    case YelpImageSizes.square348:
      return { height: 348, width: 348 };
  }
}

// Note: The default size is original if the given size is larger than 600
function convertExplicitImageDimensionsToYelpImageSizes(
  dimensions: ResizableImageDimensions
) {
  const smallestDimension = Math.min(dimensions.height, dimensions.width);

  if (smallestDimension <= 40) return YelpImageSizes.small;
  else if (smallestDimension <= 100) return YelpImageSizes.medium;
  else if (smallestDimension <= 250) return YelpImageSizes.largeSquare;
  else if (smallestDimension <= 348) return YelpImageSizes.large;
  else if (smallestDimension > 348) return YelpImageSizes.original;
  else return YelpImageSizes.original;
}

/**
 * ex.) https://s3-media2.fl.yelpcdn.com/bphoto/gRqfWsSDep7gFKGE4lChBQ/o.jpg -> https://s3-media2.fl.yelpcdn.com/bphoto/gRqfWsSDep7gFKGE4lChBQ/l.jpg ->
 */
function resizableYelpImageRequestBuilder({
  imageURL,
  imageSize,
}: {
  imageURL: string;
  imageSize: YelpImageSizes;
}) {
  // Precondition failure, return the default image URL if it's not resizable by Yelp's API
  if (!isImageResizableByYelp(imageURL)) return imageURL;

  // Parsing
  const urlComponents = imageURL.split("/"),
    [sizeParameter, fileExtension] =
      urlComponents[urlComponents.length - 1].split("."),
    desiredSize = [imageSize, fileExtension].join(".");

  // Validate that the existing size parameter is valid to ensure the transformed URL will also be valid
  if (!Object.values(YelpImageSizes).find((size) => size == sizeParameter))
    return imageURL;

  // Remove the old size spec, and push the new size spec + existing file extension
  urlComponents.pop();
  urlComponents.push(desiredSize);

  // (urlComponents)/l.jpg
  return urlComponents.join("/");
}

// Combined gateway for external image
/**
 * Applies the desired image size parameters to the target URL depending on the
 * supported external image provider (Yelp or Google). The image URL being passed in
 * should be valid, it can include exisiting size parameters, which is fine because they'll be
 * stripped away during processing, but Yelp URLs must have their size parameter in the URL in order
 * for it to be parsed correctly.
 *
 * @param imageURL
 * @param imageResizingProps
 *
 * @returns -> A Yelp or Google URL with the desired image size parameters applied
 */
export function externalResizableImageRequestBuilder({
  imageURL,
  imageResizingProps,
}: {
  imageURL: string;
  imageResizingProps: ResizableImageRequestProps;
}) {
  // Handlers
  if (isImageResizableByGoogle(imageURL))
    return resizableGoogleImageRequestBuilder({ imageURL, imageResizingProps });
  else if (isImageResizableByYelp(imageURL))
    return resizableYelpImageRequestBuilder({
      imageURL,
      imageSize:
        convertExplicitImageDimensionsToYelpImageSizes(imageResizingProps),
    });

  // Return the default image URL if it's not resizable by any of the above services
  return imageURL;
}
