import { SHARED_CONFIG } from "./visualization-config";

interface ContentDimensions {
  width: number;
  height: number;
  containerWidth: number;
  containerHeight: number;
}

interface ContainerDimensions {
  width: number;
  height: number;
}

/**
 * Calculate dimensions for content-based responsive design
 * Used for Entity and Time visualizations where height depends on content
 */
export function calculateContentDimensions(
  containerWidth: number,
  containerHeight: number,
  contentCount: number,
  isHorizontal: boolean = false
): ContentDimensions {
  const { content, container } = SHARED_CONFIG.responsive;

  if (isHorizontal) {
    // For horizontal content (like entities)
    const contentWidth = Math.max(
      contentCount * content.minEntityWidth +
        (contentCount - 1) * content.entityGap,
      container.minWidth
    );

    const finalWidth = Math.min(contentWidth, container.maxWidth);
    const finalHeight = Math.min(containerHeight, container.maxHeight);

    return {
      width: finalWidth,
      height: finalHeight,
      containerWidth: finalWidth,
      containerHeight: finalHeight,
    };
  } else {
    // For vertical content (like events)
    const contentHeight = Math.max(
      contentCount * content.eventHeight +
        (contentCount - 1) * content.minEventGap,
      container.minHeight
    );

    const finalWidth = Math.min(containerWidth, container.maxWidth);
    const finalHeight = Math.min(contentHeight, container.maxHeight);

    return {
      width: finalWidth,
      height: finalHeight,
      containerWidth: finalWidth,
      containerHeight: finalHeight,
    };
  }
}

/**
 * Calculate dimensions for container-based responsive design
 * Used for Topic visualization where both dimensions depend on container
 */
export function calculateContainerDimensions(
  containerWidth: number,
  containerHeight: number
): ContainerDimensions {
  const { container } = SHARED_CONFIG.responsive;

  return {
    width: Math.min(
      Math.max(containerWidth, container.minWidth),
      container.maxWidth
    ),
    height: Math.min(
      Math.max(containerHeight, container.minHeight),
      container.maxHeight
    ),
  };
}

/**
 * Align scales between visualizations
 */
export function alignScales(
  sourceScale: any,
  targetScale: any,
  isHorizontal: boolean = true
) {
  if (isHorizontal) {
    // Align x-scales (time and topic)
    targetScale.domain(sourceScale.domain());
    targetScale.range(sourceScale.range());
  } else {
    // Align y-scales (entity and time)
    targetScale.domain(sourceScale.domain());
    targetScale.range(sourceScale.range());
  }
}

/**
 * Calculate shared dimensions for aligned visualizations
 */
export function calculateAlignedDimensions(
  entityDimensions: ContentDimensions,
  timeDimensions: ContentDimensions,
  topicDimensions: ContainerDimensions
) {
  const { alignment } = SHARED_CONFIG.responsive;

  // Calculate total width including gaps
  const totalWidth =
    topicDimensions.width +
    (alignment.sharedXScale ? 0 : alignment.timeTopicGap) +
    (alignment.sharedYScale ? 0 : alignment.entityTimeGap);

  // Calculate total height
  const totalHeight = Math.max(
    entityDimensions.height,
    timeDimensions.height,
    topicDimensions.height
  );

  return {
    totalWidth,
    totalHeight,
    entityDimensions,
    timeDimensions,
    topicDimensions,
  };
}
