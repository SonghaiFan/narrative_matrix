import { merge } from "lodash";
import { SHARED_CONFIG } from "@/visualisation_new/shared/visualization-config";

export const ENTITY_CONFIG = merge({}, SHARED_CONFIG, {
  // Entity visualization specific margins
  margin: {
    left: 60, // Reduced left margin compared to shared config
    right: 20, // Reduced right margin compared to shared config
  },
  // Override minHeight to always use content-based height
  minHeight: 0,
  // Entity column styling
  entity: {
    columnPadding: 0.1, // Padding within entity columns
    columnWidth: 40, // Width of entity columns
    columnGap: 10, // Gap between entity columns
  },
  event: {
    connectorStrokeWidth: 1,
    hoverConnectorStrokeWidth: 10, // Stroke width when hovering
    innerConnectorScale: 0.9, // Scale factor for inner connector
  },
  // Metro track styling
  // Controls the appearance and behavior of the metro-style paths
  metro: {
    // Corner Radius
    // Range: 1 to 8
    // Controls how sharp or rounded the corners are
    // Larger values create more rounded corners
    // For sharp corners: 1-2
    // For rounded corners: 4-6
    // For very rounded corners: 6-8
    cornerRadius: 10, // Multiplier for point radius

    // Grid Size
    // Range: 2 to 20
    // Controls the size of the grid for snapping points
    // Smaller values create more precise paths
    // Larger values create more grid-aligned paths
    // For precise paths: 2-4
    // For balanced: 6-8
    // For grid-aligned: 10-20
    gridSize: 1, // Size of the grid for snapping

    // Minimum Segment Length
    // Range: 0.5 to 3.0
    // Controls the minimum length of straight segments
    // Smaller values allow more frequent turns
    // Larger values create longer straight sections
    // For frequent turns: 0.5-1.0
    // For balanced: 1.2-1.5
    // For long straight sections: 2.0-3.0
    minSegmentLength: 0.5, // Multiplier for corner radius

    // Preferred Angles
    // Array of angles in degrees
    // Controls which angles are preferred for track segments
    // [0, 45, 90, 135, 180] creates a standard metro grid
    // [0, 90] creates only horizontal and vertical segments
    // [0, 30, 60, 90, 120, 150, 180] creates more diagonal options
    preferredAngles: [0, 45, 90, 135, 180], // Preferred angles for track segments

    // Smoothing
    // Boolean
    // Controls whether to apply smoothing to corners
    // true: creates smooth transitions between segments
    // false: creates sharp corners
    smoothing: true, // Whether to apply smoothing to corners

    // Curve Scale
    // Range: 0.8 to 2.0
    // Controls how much the curve radius is scaled
    // Smaller values create tighter curves
    // Larger values create wider curves
    // For tight curves: 0.8-1.0
    // For balanced: 1.2-1.4
    // For wide curves: 1.6-2.0
    curveScale: 0.8, // Scale factor for curve radius

    // Maximum Curve Ratio
    // Range: 0.5 to 2.0
    // Controls the maximum size of curves relative to segment length
    // Smaller values create smaller curves
    // Larger values allow bigger curves
    // For small curves: 0.5-0.8
    // For balanced: 1.0-1.2
    // For large curves: 1.5-2.0
    maxCurveRatio: 0.5, // Maximum ratio of curve radius to segment length

    // Common Scenarios:
    // 1. Sharp Metro Grid:
    // {
    //   cornerRadius: 2,
    //   gridSize: 4,
    //   minSegmentLength: 1.0,
    //   preferredAngles: [0, 90],
    //   smoothing: false,
    //   curveScale: 1.0,
    //   maxCurveRatio: 0.8
    // }
    //
    // 2. Smooth Organic Paths:
    // {
    //   cornerRadius: 6,
    //   gridSize: 8,
    //   minSegmentLength: 1.5,
    //   preferredAngles: [0, 30, 60, 90, 120, 150, 180],
    //   smoothing: true,
    //   curveScale: 1.4,
    //   maxCurveRatio: 1.5
    // }
    //
    // 3. Balanced Metro Style (Current):
    // {
    //   cornerRadius: 4,
    //   gridSize: 6,
    //   minSegmentLength: 1.2,
    //   preferredAngles: [0, 45, 90, 135, 180],
    //   smoothing: true,
    //   curveScale: 1.2,
    //   maxCurveRatio: 1.0
    // }
    //
    // Fine-Tuning Tips:
    // 1. Start with balanced settings
    // 2. Adjust cornerRadius and curveScale for overall curve appearance
    // 3. Use gridSize and preferredAngles to control path alignment
    // 4. Fine-tune minSegmentLength to control straight sections
    // 5. Use maxCurveRatio to control maximum curve size
    // 6. Enable/disable smoothing for different corner styles
  },
  // Force layout configuration
  force: {
    // X-Force Parameters (Controls Column Alignment)
    // Range: 0.0 to 1.0
    // For rigid tracks: 0.2, 0.8
    // For flexible tracks: 0.05, 0.3
    // For balanced: 0.1, 0.5 (current)
    // For legacy behavior: 0, 0 (no x-force)
    xForceBase: 0, // Base strength for x-force (keeping nodes in their columns)
    xForceMax: 0, // Maximum x-force strength

    // Horizontal Link Parameters (Controls Same-Time Connections)
    // Range: 0.0 to 3.0
    // For tight grouping: 0.8, 2.5
    // For loose grouping: 0.3, 1.5
    // For balanced: 0.5, 2.0 (current)
    // For legacy behavior: 2.0, 2.0 (fixed strong horizontal links)
    horizontalLinkBase: 0, // Base strength for horizontal links (same narrative time)
    horizontalLinkMax: 0, // Maximum horizontal link strength

    // Vertical Link Parameter (Controls Time-Based Connections)
    // Range: 0.0 to 1.0
    // For straight tracks: 0.2
    // For curved tracks: 0.05
    // For balanced: 0.1 (current)
    // For legacy behavior: 0.1 (same as balanced)
    verticalLinkStrength: 0, // Strength for vertical links (different narrative time)

    // Node Count Scaling
    // Range: 0.0 to 1.0
    // For strong node count influence: 0.8
    // For weak node count influence: 0.3
    // For balanced: 0.5 (current)
    // For legacy behavior: 0 (no node count influence)
    nodeCountScale: 1, // How much node count affects forces

    // Node Distance Parameters
    // minNodeDistance Range: 0.5 to 2.0
    // maxNodeDistance Range: 5.0 to 15.0
    // For compact layout: 0.8, 8
    // For spread layout: 1.5, 12
    // For balanced: 1, 10 (current)
    // For legacy behavior: 2, 10 (fixed distances)
    minNodeDistance: 1, // Minimum distance between nodes
    maxNodeDistance: 10, // Maximum distance between nodes

    // Simulation Iterations
    // Range: 300 to 1000
    // For quick layout: 300
    // For stable layout: 600 (current)
    // For very stable layout: 1000
    // For legacy behavior: 300 (faster simulation)
    iterations: 100, // Number of simulation iterations

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
    // 4. Legacy Behavior (No Node Count Influence):
    // {
    //   xForceBase: 0,           // No x-force to keep nodes in columns
    //   xForceMax: 0,            // No maximum x-force
    //   horizontalLinkBase: 2.0, // Fixed strong horizontal links
    //   horizontalLinkMax: 2.0,  // Same as base for fixed strength
    //   verticalLinkStrength: 0.1, // Same as balanced
    //   nodeCountScale: 0,       // No node count influence
    //   minNodeDistance: 2,      // Fixed minimum distance
    //   maxNodeDistance: 10,     // Fixed maximum distance
    //   iterations: 300          // Faster simulation
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
