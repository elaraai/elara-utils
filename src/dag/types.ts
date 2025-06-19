import { ArrayType, BooleanType, DateTimeType, DictType, FloatType, IntegerType, Nullable, SetType, StringType, StructType } from "@elaraai/core";

// Basic DAG node (always required: id)
export const GraphNode = StructType({
    id: StringType,
    type: StringType
});
// export type GraphNode = typeof GraphNode;

// Basic DAG edge (always required: from, to, type)
export const GraphEdge = StructType({
    from: StringType,
    to: StringType,
    type: StringType
});
// export type GraphEdge = typeof GraphEdge;

// Extended node types for specific algorithms


export const GraphEnhancedTraversalNode = StructType({
    id: StringType,
    type: StringType,
    visited_order: IntegerType,
    depth: IntegerType,
    parent_edge_types: ArrayType(StringType), // Types of edges leading to this node from the parent node
    parent_id: Nullable(StringType),
    parent_type: Nullable(StringType)
});

// Topological sort result node
export const GraphTopologicalNode = StructType({
    id: StringType,
    topo_order: IntegerType,
    layer: IntegerType
});
// export type GraphTopologicalNode = typeof GraphTopologicalNode;

// Cycle detection result
export const GraphCycleResult = StructType({
    has_cycle: BooleanType,
    cycle_nodes: ArrayType(StringType)
});
// export type GraphCycleResult = typeof GraphCycleResult;

// Ancestor/descendant result node
export const GraphAncestorNode = StructType({
    id: StringType,
    ancestors: ArrayType(StringType),
    descendants: ArrayType(StringType),
    reachable_nodes: ArrayType(StringType)
});
// export type GraphAncestorNode = typeof GraphAncestorNode;

// Path analysis result
export const GraphPathResult = StructType({
    paths: ArrayType(ArrayType(StringType)),
    path_count: IntegerType
});
// export type GraphPathResult = typeof GraphPathResult;

// Path membership node
export const GraphPathNode = StructType({
    id: StringType,
    path_membership: ArrayType(IntegerType)
});
// export type GraphPathNode = typeof GraphPathNode;




// Weighted edge for path analysis
export const GraphWeightedEdge = StructType({
    from: StringType,
    to: StringType,
    weight: FloatType,
    delay: Nullable(FloatType)
});
// export type GraphWeightedEdge = typeof GraphWeightedEdge;


// Shortest path result
export const GraphShortestPathResult = StructType({
    shortest_path: ArrayType(StringType),
    total_cost: FloatType
});
// export type GraphShortestPathResult = typeof GraphShortestPathResult;
// Value node for aggregation
export const GraphValueNode = StructType({
    id: StringType,
    value: FloatType,
    weight: Nullable(FloatType)
});

// Aggregation result node
export const GraphAggregationNode = StructType({
    id: StringType,
    aggregated_value: FloatType,
    contributing_nodes: ArrayType(StringType)
});

// Group value node for aggregation
export const GraphGroupValueNode = StructType({
    id: StringType,
    value: DictType(StringType, FloatType)
});

// Group value aggregation result node
export const GraphGroupAggregationNode = StructType({
    id: StringType,
    aggregated_values: DictType(StringType, FloatType),
    contributing_nodes: ArrayType(StringType)
});

// Weighted aggregation result node
export const GraphWeightedAggregationNode = StructType({
    id: StringType,
    weighted_sum: FloatType,
    weighted_average: FloatType,
    total_weight: FloatType
});

// Temporal node for duration-based algorithms
export const GraphTemporalNode = StructType({
    id: StringType,
    type: StringType,
    start_time: DateTimeType,
    end_time: DateTimeType
});

// Critical path result
export const GraphCriticalPathResult = StructType({
    critical_path: ArrayType(StringType),
    total_duration: FloatType
});

// System Loss Detection types - simple and focused on actual losses
export const GraphVolumeNode = StructType({
    id: StringType,
    capacity: Nullable(FloatType)  // Optional capacity for physical vessels, null for process operations
});

export const GraphVolumeEdge = StructType({
    from: StringType,
    to: StringType,
    volume: FloatType  // Volume transferred
});

// System Loss Detection result types
export const GraphNodeLoss = StructType({
    node_id: StringType,
    volume_in: FloatType,
    volume_out: FloatType,
    actual_loss: FloatType                      // Positive = loss, negative = gain
});

export const GraphSystemLossResult = StructType({
    total_input_volume: FloatType,              // Sum of all external inputs to system
    total_output_volume: FloatType,             // Sum of all external outputs from system
    total_system_loss: FloatType,               // Total volume lost (input - output)
    node_losses: ArrayType(GraphNodeLoss)            // Per-node loss analysis
});


// Active edge for reachability
export const GraphActiveEdge = StructType({
    from: StringType,
    to: StringType,
    type: StringType,
    active: BooleanType
});
// export type GraphActiveEdge = typeof GraphActiveEdge;


// Reachability result
export const GraphReachabilityResult = StructType({
    ancestor_map: ArrayType(StructType({
        node: StringType,
        ancestors: ArrayType(StringType)
    })),
    descendant_map: ArrayType(StructType({
        node: StringType,
        descendants: ArrayType(StringType)
    }))
});
// export type GraphReachabilityResult = typeof GraphReachabilityResult;



// Graph aggregation by type result nodes
export const GraphTypeAggregateNode = StructType({
    type: StringType,
    node_count: IntegerType
});
// export type GraphTypeAggregateNode = typeof GraphTypeAggregateNode;

// Graph aggregation by type result edges
export const GraphTypeAggregateEdge = StructType({
    from_type: StringType,
    to_type: StringType,
    edge_type: StringType,
    transition_count: IntegerType,
    transition_probability: FloatType
});
// export type GraphTypeAggregateEdge = typeof GraphTypeAggregateEdge;

// Graph aggregation by type result
export const GraphTypeAggregateResult = StructType({
    aggregate_nodes: ArrayType(GraphTypeAggregateNode),
    aggregate_edges: ArrayType(GraphTypeAggregateEdge)
});
// export type GraphTypeAggregateResult = typeof GraphTypeAggregateResult;






// Path subgraph for source/target extraction algorithms
export const GraphPathSubgraph = StructType({
    nodes: ArrayType(GraphNode),
    edges: ArrayType(GraphEdge),
    source_nodes: ArrayType(StringType),
    target_nodes: ArrayType(StringType),
    node_types: SetType(StringType),
    edge_types: SetType(StringType)
});


// Graph overview statistics result
export const GraphTypeStatistics = StructType({
    // Basic counts
    node_count: IntegerType,
    edge_count: IntegerType,

    // Node types
    node_types: ArrayType(StringType),
    unique_node_types_count: IntegerType,
    source_node_types: ArrayType(StringType),
    target_node_types: ArrayType(StringType),

    // Edge types
    edge_types: ArrayType(StringType),
    unique_edge_types_count: IntegerType,

    // Type aggregation details
    aggregate_nodes: ArrayType(GraphTypeAggregateNode),
    aggregate_edges: ArrayType(GraphTypeAggregateEdge)
});


// Graph overview statistics result
export const GraphValidStatistics = StructType({
    // Cheap basic metrics
    total_node_count: IntegerType,
    total_edge_count: IntegerType,
    valid_node_count: IntegerType,
    valid_edge_count: IntegerType,
    orphaned_node_count: IntegerType,
    dangling_edge_count: IntegerType,
    duplicate_node_count: IntegerType,
    duplicate_edge_count: IntegerType,

    // Cheap ratios
    node_validity_ratio: FloatType,
    edge_validity_ratio: FloatType,
    connectivity_ratio: FloatType,

    // Moderate - but very valuable for your use case
    problematic_node_types: ArrayType(StructType({
        node_type: StringType,
        orphaned_count: IntegerType,
        total_count: IntegerType,
        orphaned_percentage: FloatType
    })),

    problematic_edge_patterns: ArrayType(StructType({
        from_type: StringType,
        to_type: StringType,
        dangling_count: IntegerType,
        valid_count: IntegerType,
        failure_rate: FloatType
    }))
});


// Graph path statistics result - comprehensive path analysis metrics
export const GraphPathStatistics = StructType({
    // Basic counts
    node_count: IntegerType,
    edge_count: IntegerType,

    // Path depth metrics (longest dependency chain)
    longest_path_length: IntegerType,      // Number of edges in longest simple path (dependency depth)
    longest_path_depth: IntegerType,       // Number of levels in deepest path (1-based: root=1, child=2, etc.)

    // Graph connectivity metrics (reachability breadth)
    total_reachable_nodes: FloatType,      // Maximum nodes reachable from any source (connectivity measure)
    connectivity_span: IntegerType,        // Edges in spanning tree from most connected source

    // Structural metrics
    branching_factor: FloatType,           // Average outgoing edges per node (complexity measure)

    // Path signature (for pattern analysis)
    node_type_sequence: ArrayType(StringType)  // Array of node types in traversal order from deepest path
});

