import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const ENTITY_CONFIG = merge({}, SHARED_CONFIG, {
  // Entity visualization specific margins
  margin: {
    left: 60, // Reduced left margin compared to shared config
    right: 20, // Reduced right margin compared to shared config
  },
  // Entity column styling
  entity: {
    columnPadding: 0.1, // Padding within entity columns
    columnWidth: 50, // Width of entity columns
    columnGap: 10, // Gap between entity columns
  },
  event: {
    connectorStrokeWidth: 6,
    hoverConnectorStrokeWidth: 18, // Stroke width when hovering
    innerConnectorScale: 0.85, // Scale factor for inner connector
  },
  // Metro track styling
  metro: {
    cornerRadius: 4, // Multiplier for point radius
    gridSize: 6, // Size of the grid for snapping
    minSegmentLength: 1.2, // Multiplier for corner radius
    preferredAngles: [0, 45, 90, 135, 180], // Preferred angles for track segments
    smoothing: true, // Whether to apply smoothing to corners
    curveScale: 1.2, // Scale factor for curve radius
    maxCurveRatio: 1, // Maximum ratio of curve radius to segment length
  },
  // Force layout configuration
  force: {
    // X-Force Parameters (Controls Column Alignment)
    // Range: 0.0 to 1.0
    // For rigid tracks: 0.2, 0.8
    // For flexible tracks: 0.05, 0.3
    // For balanced: 0.1, 0.5 (current)
    xForceBase: 0.1, // Base strength for x-force (keeping nodes in their columns)
    xForceMax: 0.5, // Maximum x-force strength

    // Horizontal Link Parameters (Controls Same-Time Connections)
    // Range: 0.0 to 3.0
    // For tight grouping: 0.8, 2.5
    // For loose grouping: 0.3, 1.5
    // For balanced: 0.5, 2.0 (current)
    horizontalLinkBase: 0.5, // Base strength for horizontal links (same narrative time)
    horizontalLinkMax: 2.0, // Maximum horizontal link strength

    // Vertical Link Parameter (Controls Time-Based Connections)
    // Range: 0.0 to 1.0
    // For straight tracks: 0.2
    // For curved tracks: 0.05
    // For balanced: 0.1 (current)
    verticalLinkStrength: 0.1, // Strength for vertical links (different narrative time)

    // Node Count Scaling
    // Range: 0.0 to 1.0
    // For strong node count influence: 0.8
    // For weak node count influence: 0.3
    // For balanced: 0.5 (current)
    nodeCountScale: 0.5, // How much node count affects forces

    // Node Distance Parameters
    // minNodeDistance Range: 0.5 to 2.0
    // maxNodeDistance Range: 5.0 to 15.0
    // For compact layout: 0.8, 8
    // For spread layout: 1.5, 12
    // For balanced: 1, 10 (current)
    minNodeDistance: 1, // Minimum distance between nodes
    maxNodeDistance: 10, // Maximum distance between nodes

    // Simulation Iterations
    // Range: 300 to 1000
    // For quick layout: 300
    // For stable layout: 600 (current)
    // For very stable layout: 1000
    iterations: 600, // Number of simulation iterations

    // Common Scenarios:
    // 1. Very Rigid Tracks:
    // {
    //   xForceBase: 0.2,
    //   xForceMax: 0.8,
    //   horizontalLinkBase: 0.8,
    //   horizontalLinkMax: 2.5,
    //   verticalLinkStrength: 0.2,
    //   nodeCountScale: 0.8,
    //   minNodeDistance: 0.8,
    //   maxNodeDistance: 8,
    //   iterations: 800
    // }
    //
    // 2. Flexible Tracks:
    // {
    //   xForceBase: 0.05,
    //   xForceMax: 0.3,
    //   horizontalLinkBase: 0.3,
    //   horizontalLinkMax: 1.5,
    //   verticalLinkStrength: 0.05,
    //   nodeCountScale: 0.3,
    //   minNodeDistance: 1.5,
    //   maxNodeDistance: 12,
    //   iterations: 500
    // }
    //
    // 3. Balanced Layout (Current):
    // {
    //   xForceBase: 0.1,
    //   xForceMax: 0.5,
    //   horizontalLinkBase: 0.5,
    //   horizontalLinkMax: 2.0,
    //   verticalLinkStrength: 0.1,
    //   nodeCountScale: 0.5,
    //   minNodeDistance: 1,
    //   maxNodeDistance: 10,
    //   iterations: 600
    // }
    //
    // Fine-Tuning Tips:
    // 1. Start with balanced settings
    // 2. Adjust xForceBase and xForceMax first to control overall rigidity
    // 3. Then adjust horizontalLinkBase and horizontalLinkMax to control grouping
    // 4. Fine-tune verticalLinkStrength to control track straightness
    // 5. Use nodeCountScale to adjust how much node count affects rigidity
    // 6. Finally, adjust distances and iterations for optimal spacing and stability
  },
});
