# elara-utils

Utilities and helpers for the application of Elara Development Kit (EDK)

## Overview

This repository provides a collection of utilities and helper functions designed to enhance and extend the capabilities of the Elara Development Kit (EDK). The EDK consists of two core dependencies:

- **@elaraai/core** - Core functionality and data structures
- **@elaraai/cli** - Command-line interface and development tools

## Structure

The utilities are organized into thematic subdirectories under `src/`, each containing specialized tools and helpers:

### DAG Utilities (`src/dag/`)

Directed Acyclic Graph utilities for data flow analysis and processing. The DAG utilities are organized into specialized modules, each containing focused procedures for specific graph operations.

- **Guides:**
  - [DAG Development Guide](src/dag/DAG_DEVELOPMENT_GUIDE.md) - Development patterns and best practices

- **Core Modules:**

#### Core Infrastructure (`src/dag/core/`)
Fundamental graph operations and validation:
- `adjacency_lists.ts` - Builds both forward and reverse adjacency list representations from graph edges, used by most other graph algorithms
- `validation.ts` - Validates graph structure and identifies issues including orphaned nodes, dangling edges, duplicate nodes, and duplicate edges
- `index.ts` - Exports all core procedures

#### Graph Traversal (`src/dag/traversal/`) 
Core graph traversal algorithms and analysis:
- `breadth_first.ts` - Performs breadth-first search traversal visiting nodes level by level from the starting node using queue-based exploration
- `depth_first.ts` - Performs depth-first search traversal exploring as far as possible along each branch before backtracking using stack-based exploration
- `tracked_breadth_first.ts` - BFS traversal with detailed metadata tracking including visit order, depth, parent relationships, and edge type information for spanning tree construction and debugging
- `tracked_depth_first.ts` - DFS traversal with detailed metadata tracking including visit order, depth, parent relationships, and edge type information for cycle detection and dependency analysis
- `topological_sort.ts` - Orders nodes such that for every edge (A→B), A comes before B, essential for dependency-based task scheduling
- `cycle_detection.ts` - Detects if the graph contains any cycles and identifies the nodes involved using DFS with state tracking
- `ancestor_descendant.ts` - Identifies all ancestors, descendants, and reachable nodes for each node through transitive closure computation
- `index.ts` - Exports all graph traversal procedures

#### Connectivity Analysis (`src/dag/connectivity/`)
Network connectivity and component analysis:
- `connected_components.ts` - Identifies connected components in an undirected graph representation using optimized O(V + E) algorithm with unique component IDs
- `dynamic_reachability.ts` - Analyzes graph reachability considering only active edges, computing ancestors and descendants via active connections only
- `bridge_analysis.ts` - Identifies critical nodes whose removal would increase the number of connected components
- `index.ts` - Exports all connectivity procedures

#### Path Analysis (`src/dag/paths/`)
Advanced path finding and subgraph extraction:
- `all_paths.ts` - Finds all possible paths between two nodes in a directed graph using DFS with backtracking for exhaustive path enumeration
- `path_membership.ts` - Determines which paths each node belongs to by analyzing participation across all possible routes between start and end
- `shortest_path.ts` - Finds the path with minimum total weight from start to end node using Dijkstra's algorithm for weighted graphs
- `critical_path.ts` - Identifies the longest path through a project network to determine project duration and critical tasks for scheduling
- `subgraph_extraction.ts` - **Optimized O(V + E)** - Extracts subgraphs by connected components with optional node type filtering, with dramatic performance improvements for large graphs
- `network_extraction.ts` - Extracts complete connected processing networks from specified starting points for batch genealogy traceability and supply chain analysis
- `index.ts` - Exports all path analysis procedures

#### Data Aggregation (`src/dag/aggregation/`)
Value aggregation and rollup operations across graph structures:
- `bottom_up.ts` - Aggregates node values from leaf nodes upward through dependency tree to calculate total value impact including all descendants
- `top_down.ts` - Distributes values from parent nodes downward through dependency tree, sharing parent resources equally among direct children  
- `weighted.ts` - Aggregates values using node weights from leaf nodes upward, computing weighted sums, averages, and total weights
- `group_values.ts` - Aggregates multi-attribute dictionary values from leaf nodes upward, summing each dictionary key independently across the dependency tree
- `temporal_bottom_up.ts` - Aggregates task durations from leaf nodes upward through dependency tree to calculate total time impact including all descendants
- `temporal_top_down.ts` - Aggregates task durations from root nodes downward through dependency tree to calculate total prerequisite work needed
- `type_aggregation.ts` - Groups nodes by type and analyzes type-to-type transitions to create aggregate graph structure with transition probabilities
- `type_statistics.ts` - Fast type-based analysis providing node type patterns, source/target identification, and type transition probabilities without expensive traversal
- `path_statistics.ts` - Comprehensive path analysis using graph traversal to calculate path depth, branching factors, and type sequence patterns for workflow complexity assessment
- `index.ts` - Exports all aggregation procedures

#### Analysis and Validation (`src/dag/analysis/`)
Specialized analysis procedures for graph patterns and completeness:
- `missing_transitions.ts` - Identifies expected node type transitions that are absent from the graph
- `workflow_completeness.ts` - Validates end-to-end workflow patterns and completeness
- `type_aggregation.ts` - Groups nodes by type and analyzes type-to-type transitions
- `type_statistics.ts` - Fast type-based analysis without expensive traversal
- `path_statistics.ts` - Comprehensive path analysis using graph traversal
- `index.ts` - Exports all analysis procedures

#### Flow Processing (`src/dag/flow/`)
Network flow analysis and volume tracking:
- `volume_flow.ts` - Identifies, quantifies, and locates actual volume losses in industrial processing networks by analyzing flow patterns and calculating where material goes missing
- `index.ts` - Exports all flow procedures

#### Core Types and Tests
- `types.ts` - TypeScript type definitions for all DAG structures and interfaces
- `__tests/` - Comprehensive test suite with 25+ test files organized by procedure for thorough validation

## Development

### Running Tests

The project includes a comprehensive test suite with 25+ individual test files organized by procedure. Use the provided Makefile to run tests:

```bash
# Run all tests
make all

# Run test suites by module
make dag_aggregation_tests           # All aggregation procedures
make dag_flow_tests                  # System loss detection
make dag_traversal_tests             # BFS, DFS, topological sort, cycles
make dag_paths_tests                 # Path finding and subgraph extraction
make dag_core_tests                  # Adjacency lists and validation
make dag_connectivity_tests          # Connected components and reachability
make dag_analysis_tests              # Graph analysis and statistics

# Run individual procedure tests
make dag_flow_volume_flow_tests
make dag_aggregation_bottom_up_tests
make dag_traversal_breadth_first_tests
# ... and 25+ more individual test targets
```

**Test Organization**: Each procedure has dedicated test files in `src/dag/__tests/` with comprehensive test cases covering edge cases, error conditions, and performance scenarios.

## Future Expansion

This repository is designed to accommodate additional utility themes as they are developed. New subdirectories will be added under `src/` to organize utilities by their specific domain or functionality.

## Using this library

```typescript
import { Procedure } from "@elaraai/core";
import { 
  graph_aggregation_bottom_up 
} from "elara-utils/src/dag/aggregation";
import { 
  graph_bfs,
  graph_connected_components
} from "elara-utils/src/dag/traversal";
import { 
  graph_subgraph_extraction
} from "elara-utils/src/dag/paths";
import { 
  graph_validate 
} from "elara-utils/src/dag/core";
import { 
  graph_volume_flow
} from "elara-utils/src/dag/flow";

// Use the DAG utilities in your EDK procedures
const myAnalysisProcedure = new Procedure("my_analysis")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_types", SetType(StringType))
  .output(SubgraphExtractionResult)
  .import(graph_subgraph_extraction)
  .import(graph_validate)
  .body(($, { nodes, edges, source_types }, procs) => {
    // Validate graph structure first
    const validation = $.let(procs.graph_validate(Struct({ nodes, edges })));
    
    // Extract subgraphs with optional filtering
    const result = $.let(procs.graph_subgraph_extraction(Struct({ 
      nodes, 
      edges, 
      filter_by_types: source_types
    })));
    
    $.return(result);
  });
```

## Contributing

When adding new utilities:

1. Organize code into thematic subdirectories under `src/`
2. Include comprehensive tests with `_tests.ts` suffix
3. Add relevant documentation and guides
4. Update the Makefile to include new test targets

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
