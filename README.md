# elara-utils

Utilities and helpers for the application of Elara Development Kit (EDK)

## Overview

This repository provides a collection of utilities and helper functions designed to enhance and extend the capabilities of the Elara Development Kit (EDK). The EDK consists of two core dependencies:

- **@elaraai/core** - Core functionality and data structures
- **@elaraai/cli** - Command-line interface and development tools

## Structure

The utilities are organized into thematic subdirectories under `src/`, each containing specialized tools and helpers:

### DAG Utilities (`src/dag/`)

Directed Acyclic Graph utilities for data flow analysis and processing:

- **Guides:**
  - [DAG Application Guide](src/dag/DAG_APPLICATION_GUIDE.md) - How to apply DAG utilities in your projects
  - [DAG Development Guide](src/dag/DAG_DEVELOPMENT_GUIDE.md) - Development patterns and best practices

- **Core Modules:**
  - `aggregation.ts` - Data aggregation functions for DAG nodes
  - `flow_conservation.ts` - Flow conservation analysis and validation
  - `graph_traversal.ts` - Graph traversal algorithms and utilities
  - `path_analysis.ts` - Path finding and analysis tools
  - `shared_utils.ts` - Common utilities shared across DAG modules
  - `time_aggregation.ts` - Time-based aggregation functions
  - `types.ts` - TypeScript type definitions

## Development

### Running Tests

Use the provided Makefile to run tests for specific modules:

```bash
# Run all tests
make all

# Run specific test suites
make dag_aggregation_tests
make dag_flow_conservation_tests
make dag_time_aggregation_tests
make dag_shared_utils_tests
make dag_path_analysis_tests
make dag_graph_traversal_tests
```

## Future Expansion

This repository is designed to accommodate additional utility themes as they are developed. New subdirectories will be added under `src/` to organize utilities by their specific domain or functionality.

## Using this library

```typescript
import { Procedure } from "@elaraai/core";
import { 
  graph_bottom_up_aggregation,
  graph_bfs,
  graph_validate
} from "elara-utils/src/dag";

// Use the DAG utilities in your EDK procedures
const myProcedure = new Procedure("my_analysis")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .output(ArrayType(GraphAggregationNode))
  .import(graph_bottom_up_aggregation)
  .body(($, { nodes, edges }, procs) => {
    const result = $.let(procs.graph_bottom_up_aggregation(Struct({ nodes, edges })));
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
