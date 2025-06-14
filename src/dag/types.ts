import { ArrayType, BooleanType, DateTimeType, DictType, FloatType, IntegerType, Nullable, StringType, StructType } from "@elaraai/core";

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

// Traversal result node
export const GraphTraversalNode = StructType({
    id: StringType,
    visited_order: IntegerType,
    depth: IntegerType,
    parent_id: Nullable(StringType)
});
// export type GraphTraversalNode = typeof GraphTraversalNode;

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

// Temporal node for duration-based algorithms
export const GraphTemporalNode = StructType({
    id: StringType,
    type: StringType,
    start_time: DateTimeType,
    end_time: DateTimeType
});
// export type GraphTemporalNode = typeof GraphTemporalNode;

// Critical path result node
export const GraphCriticalPathNode = StructType({
    id: StringType,
    earliest_start: FloatType,
    latest_finish: FloatType
});
// export type GraphCriticalPathNode = typeof GraphCriticalPathNode;

// Critical path result
export const GraphCriticalPathResult = StructType({
    critical_path: ArrayType(StringType),
    total_duration: FloatType
});
// export type GraphCriticalPathResult = typeof GraphCriticalPathResult;

// Weighted edge for path analysis
export const GraphWeightedEdge = StructType({
    from: StringType,
    to: StringType,
    weight: FloatType,
    delay: Nullable(FloatType)
});
// export type GraphWeightedEdge = typeof GraphWeightedEdge;

// Shortest path result node
export const GraphShortestPathNode = StructType({
    id: StringType,
    distance: FloatType,
    shortest_path_parent: Nullable(StringType)
});
// export type GraphShortestPathNode = typeof GraphShortestPathNode;

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
// export type GraphValueNode = typeof GraphValueNode;

// Aggregation result node
export const GraphAggregationNode = StructType({
    id: StringType,
    aggregated_value: FloatType,
    contributing_nodes: ArrayType(StringType)
});
// export type GraphAggregationNode = typeof GraphAggregationNode;

// Group value node for aggregation
export const GraphGroupValueNode = StructType({
    id: StringType,
    value: DictType(StringType, FloatType)
});
// export type GraphGroupValueNode = typeof GraphGroupValueNode;

// Group value aggregation result node
export const GraphGroupAggregationNode = StructType({
    id: StringType,
    aggregated_values: DictType(StringType, FloatType),
    contributing_nodes: ArrayType(StringType)
});
// export type GraphGroupAggregationNode = typeof GraphGroupAggregationNode;

// Weighted aggregation result node
export const GraphWeightedAggregationNode = StructType({
    id: StringType,
    weighted_sum: FloatType,
    weighted_average: FloatType,
    total_weight: FloatType
});
// export type GraphWeightedAggregationNode = typeof GraphWeightedAggregationNode;

// Flow node for conservation algorithms
export const GraphFlowNode = StructType({
    id: StringType,
    value: FloatType,
    capacity: FloatType
});
// export type GraphFlowNode = typeof GraphFlowNode;

// Flow edge with loss
export const GraphFlowEdge = StructType({
    from: StringType,
    to: StringType,
    weight: FloatType,
    loss_percentage: FloatType
});
// export type GraphFlowEdge = typeof GraphFlowEdge;

// Flow conservation result node
export const GraphFlowConservationNode = StructType({
    id: StringType,
    input_total: FloatType,
    output_total: FloatType,
    loss_total: FloatType
});
// export type GraphFlowConservationNode = typeof GraphFlowConservationNode;

// Flow conservation result
export const GraphFlowConservationResult = StructType({
    is_conserved: BooleanType,
    violations: ArrayType(StringType)
});
// export type GraphFlowConservationResult = typeof GraphFlowConservationResult;

// Active edge for reachability
export const GraphActiveEdge = StructType({
    from: StringType,
    to: StringType,
    type: StringType,
    active: BooleanType
});
// export type GraphActiveEdge = typeof GraphActiveEdge;

// Reachability result node
export const GraphReachabilityNode = StructType({
    id: StringType,
    reachable_from: ArrayType(StringType),
    can_reach: ArrayType(StringType)
});
// export type GraphReachabilityNode = typeof GraphReachabilityNode;

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

// Connected components result node
export const GraphComponentNode = StructType({
    id: StringType,
    component_id: StringType
});
// export type GraphComponentNode = typeof GraphComponentNode;

// Connected components result
export const GraphComponentResult = StructType({
    component_count: IntegerType,
    component_sizes: ArrayType(StructType({
        component_id: StringType,
        size: IntegerType
    }))
});
// export type GraphComponentResult = typeof GraphComponentResult;

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



export const GraphDuplicateNode = StructType({
    id: StringType,
    count: IntegerType,
    instances: ArrayType(GraphNode)
})

export const GraphDuplicateEdge = StructType({
    from: StringType,
    from_type: Nullable(StringType),
    to: StringType,
    to_type: Nullable(StringType),
    count: IntegerType
})

export const GraphDanglingEdge = StructType({
    from: StringType,
    from_type: Nullable(StringType),
    to: StringType,
    to_type: Nullable(StringType),
})


export const GraphValidateResult = StructType({
    valid_nodes: ArrayType(GraphNode),
    valid_edges: ArrayType(GraphEdge),
    orphaned_nodes: ArrayType(GraphNode),
    dangling_edges: ArrayType(GraphDanglingEdge),
    duplicate_nodes: ArrayType(GraphDuplicateNode),
    duplicate_edges: ArrayType(GraphDuplicateEdge),

    // These require connected components analysis PER subgraph
    largest_valid_component_size: IntegerType,        // Needs connected components
    component_fragmentation: FloatType,               // Needs connected components

    // Pattern matching across multiple subgraphs
    missing_transition_patterns: ArrayType(StructType({
        expected_from_type: StringType,     // e.g., "weightnote" 
        expected_to_type: StringType,       // e.g., "crushing"
        components_missing_pattern: IntegerType,
        description: StringType             // "weightnote nodes not connecting to crushing"
    })),     // Cross-subgraph analysis
    bridge_node_analysis: ArrayType(StructType({
        node_type: StringType,
        acts_as_bridge_count: IntegerType,    // Nodes connecting components
        criticality_score: FloatType          // How critical for connectivity
    })),
    workflow_completeness: StructType({
        complete_workflows: IntegerType,       // weightnote→crushing→operations
        incomplete_workflows: IntegerType,     // Missing steps
        most_common_break_point: StringType   // Where workflows typically break
    })
});

// Path subgraph for source/target extraction algorithms
export const GraphPathSubgraph = StructType({
    nodes: ArrayType(GraphNode),
    edges: ArrayType(GraphEdge),
    source_nodes: ArrayType(GraphNode),
    target_nodes: ArrayType(GraphNode)
});

// Path subgraphs result
export const GraphPathSubgraphsResult = StructType({
    subgraphs: ArrayType(GraphPathSubgraph)
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

