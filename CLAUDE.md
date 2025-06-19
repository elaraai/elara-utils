# EDK Procedures and Expressions Cheat Sheet

## EDK Source References

This documentation is based on the following EDK core exports from `@elaraai/core`:

- **Procedure Implementation**: `@elaraai/core/dist/east/procedures/Procedure.d.ts`
- **Expression Definitions**: `@elaraai/core/dist/east/definition/index.d.ts`
- **Core Expression Types**: `@elaraai/core/dist/east/definition/core.d.ts`
- **Array Operations**: `@elaraai/core/dist/east/definition/array.d.ts`
- **Set Operations**: `@elaraai/core/dist/east/definition/set.d.ts`
- **Dictionary Operations**: `@elaraai/core/dist/east/definition/dict.d.ts`
- **String Operations**: `@elaraai/core/dist/east/definition/string.d.ts`
- **Number Operations**: `@elaraai/core/dist/east/definition/number.d.ts`
- **Boolean Operations**: `@elaraai/core/dist/east/definition/boolean.d.ts`
- **Collection Utilities**: `@elaraai/core/dist/east/definition/collections.d.ts`
- **Type System**: `@elaraai/core/dist/east/types.d.ts`
- **Function Blocks**: `@elaraai/core/dist/east/procedures/FunctionBlock.d.ts`

## Key Principles

1. **Procedures are newer and faster** - Prefer Procedure methods over Expressions when available
2. **Clear distinction**: Procedures compile to imperative JSON; Expressions compile to functional JSON
3. **Use iteration in Procedures** - Prefer `$.forArray()` over functional `Filter()`/`Map()`
4. **Collections**: Use Procedure methods (`$.insert()`, `$.pushLast()`) over Expression equivalents

## Procedures vs Expressions

### Procedures (Imperative DSL - Newer, Faster)
- **Definition**: `new Procedure("name").input().output().body(($, inputs) => { ... })`
- **Execution**: Imperative control flow with statements
- **Use for**: Control flow, mutation, iteration, primary algorithm logic

### Expressions (Functional DSL - Older)
- **Definition**: Functions that return typed values (`NewArray()`, `Add()`, `Get()`)
- **Execution**: Functional composition 
- **Use for**: Value creation, calculations, conditions in Procedures

## Graph Types (from /dag/types.ts)

```typescript
// Defined in src/dag/types.ts (using @elaraai/core exports)
import { StructType, StringType } from "@elaraai/core";

export const GraphNode = StructType({
    id: StringType,     // Node identifier
    type: StringType    // Node type
});

export const GraphEdge = StructType({
    from: StringType,   // Source node id
    to: StringType      // Target node id
});
```

## Procedure Control Flow (Imperative - Prefer These)

### Variable Management
```typescript
// Procedure methods (use these)
const variable = $.let(initialValue);      // Create variable
$.assign(variable, newValue);              // Reassign variable
```

### Conditionals  
```typescript
// Procedure methods (use these)
$.if(condition).then($ => {
    // True branch
}).else($ => {
    // False branch  
});

$.ifNull(nullable).then($ => {
    // Null branch
}).else(($, nonNullValue) => {
    // Non-null branch with unwrapped value
});

// AVOID: Complex conditional assignments (invalid)
// const result = $.let($.if(condition).then(...).else(...)); // DON'T DO THIS

// CORRECT: Use separate variable and assign in branches
const result = $.let(defaultValue);
$.if(condition).then($ => {
    $.assign(result, trueValue);
}).else($ => {
    $.assign(result, falseValue);
});
```

### Loops (Prefer These Over Expression Iteration)
```typescript
// Procedure methods (use these instead of Filter/Map expressions)
$.while(condition, ($, label) => {
    // Loop body
    $.if(breakCondition).then($ => $.break(label));
    $.if(continueCondition).then($ => $.continue(label));
});

$.forArray(array, ($, element, index, label) => {
    // Iterate elements - prefer this over Filter/Map
});

$.forSet(set, ($, element, label) => {
    // Iterate set elements
});

$.forDict(dict, ($, key, value, label) => {
    // Iterate dictionary entries
});
```

## Collection Operations

### Array Operations (Prefer Procedure Methods)
```typescript
// Expression (for creation only)
const array = $.let(NewArray(StringType));

// Procedure methods (prefer these for operations)
$.pushLast(array, element);                // Add to end (enqueue for BFS)
$.pushFirst(array, element);               // Add to beginning  
$.deleteFirst(array);                      // Remove from front (dequeue for BFS)
$.deleteLast(array);                       // Remove from end (pop for DFS)
$.update(array, index, newValue);          // Update at index
$.clear(array);                            // Remove all elements
```

### Set Operations (Prefer Procedure Methods)  
```typescript
// Expression (for creation only)
const visited = $.let(NewSet(StringType));

// Procedure methods (prefer these for operations)
$.insert(visited, element);                // Add element
$.insertOrUpdate(visited, element);        // Add or update
$.delete(visited, element);                // Remove element  
$.deleteIfExists(visited, element);        // Remove if exists
```

### Dictionary Operations (Prefer Procedure Methods)
```typescript
// Expression (for creation only)
const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));

// Procedure methods (prefer these for operations)  
$.insert(dict, key, value);                // Add key-value pair (when key doesn't exist)
$.insertOrUpdate(dict, key, newValue);     // Insert or update (preferred for dict operations)
$.update(dict, key, newValue);             // Update value (use insertOrUpdate instead)
$.update(dict, key, oldValue => newValue); // Update with function
$.delete(dict, key);                       // Remove key
$.deleteIfExists(dict, key);               // Remove if exists

// Dictionary iteration
$.forDict(dict, ($, value, key) => {       // Iterate over dict entries
    // Process each key-value pair
    $.insertOrUpdate(resultDict, key, value);
});
```

## Expressions (Functional - Use for Values/Conditions)

### Value Creation
```typescript
// Data structure creation (expressions)
NewArray(ElementType, [elements])          // Create array
NewSet(StringType, [elements])             // Create set  
NewDict(KeyType, ValueType, keys, values)  // Create dictionary
Const(value)                               // Literal value
Struct({ field1: value1, field2: value2 }) // Create struct
```

### Data Access  
```typescript
// Access operations (expressions)
Get(collection, key)                       // Get element
Get(collection, key, defaultValue)         // Get with default
GetField(struct, "fieldName")              // Access struct field
Size(collection)                           // Get size/length
In(collection, key)                        // Check if key exists
```

### Boolean Logic (Expressions)
```typescript
// Comparison operators (expressions)
Equal(a, b)                                // a == b
Less(a, b)                                 // a < b  
Greater(a, b)                              // a > b
GreaterEqual(a, b)                         // a >= b
LessEqual(a, b)                            // a <= b

// Logical operators (expressions)  
And(condition1, condition2)                // condition1 && condition2
Or(condition1, condition2)                 // condition1 || condition2
Not(condition)                             // !condition
```

### Math Operations (Expressions)
```typescript
Add(a, b)                                  // Addition
Subtract(a, b)                             // Subtraction  
Multiply(a, b)                             // Multiplication
Divide(a, b)                               // Division
```

## BFS Implementation Pattern (Using Procedures)

```typescript
const bfs = new Procedure("bfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))  
  .input("source_node_id", StringType)
  .output(ArrayType(StringType))
  .body(($, { nodes, edges, source_node_id }) => {
    // Build adjacency list using Procedure methods
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        $.pushLast(neighbors, toId);
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StringType, [toId]));
      });
    });
    
    // BFS using queue (Procedure methods)
    const queue = $.let(NewArray(StringType, [source_node_id]));
    const visited = $.let(NewSet(StringType, [source_node_id]));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(queue), Const(0n)), $ => {
      const current = $.let(Get(queue, Const(0n)));
      $.deleteFirst(queue);
      $.pushLast(result, current);
      
      $.if(In(adjacencyList, current)).then($ => {
        const neighbors = $.let(Get(adjacencyList, current));
        $.forArray(neighbors, ($, neighbor) => {
          $.if(Not(In(visited, neighbor))).then($ => {
            $.insert(visited, neighbor);
            $.pushLast(queue, neighbor);
          });
        });
      });
    });
    
    $.return(result);
  });
```

## DFS Implementation Pattern (Using Procedures)

```typescript
const dfs = new Procedure("dfs")
  .input("nodes", ArrayType(GraphNode))
  .input("edges", ArrayType(GraphEdge))
  .input("source_node_id", StringType)
  .output(ArrayType(StringType))
  .body(($, { nodes, edges, source_node_id }) => {
    // Build adjacency list using Procedure methods
    const adjacencyList = $.let(NewDict(StringType, ArrayType(StringType)));
    
    $.forArray(edges, ($, edge) => {
      const fromId = $.let(GetField(edge, "from"));
      const toId = $.let(GetField(edge, "to"));
      
      $.if(In(adjacencyList, fromId)).then($ => {
        const neighbors = $.let(Get(adjacencyList, fromId));
        $.pushLast(neighbors, toId);
      }).else($ => {
        $.insert(adjacencyList, fromId, NewArray(StringType, [toId]));
      });
    });
    
    // DFS using stack (Procedure methods)
    const stack = $.let(NewArray(StringType, [source_node_id]));
    const visited = $.let(NewSet(StringType));
    const result = $.let(NewArray(StringType));
    
    $.while(Greater(Size(stack), Const(0n)), $ => {
      const current = $.let(Get(stack, Subtract(Size(stack), Const(1n))));
      $.deleteLast(stack);
      
      $.if(Not(In(visited, current))).then($ => {
        $.insert(visited, current);
        $.pushLast(result, current);
        
        $.if(In(adjacencyList, current)).then($ => {
          const neighbors = $.let(Get(adjacencyList, current));
          $.forArray(neighbors, ($, neighbor) => {
            $.if(Not(In(visited, neighbor))).then($ => {
              $.pushLast(stack, neighbor);
            });
          });
        });
      });
    });
    
    $.return(result);
  });
```

## Edge Cases for Graph Algorithms

1. **Empty graph** - No nodes or edges
2. **Single node** - One node, no edges  
3. **Disconnected components** - Multiple separate graphs
4. **Self-loops** - Edge from node to itself
5. **Invalid start node** - Start ID not in graph
6. **Cycles** - Circular paths
7. **Duplicate edges** - Multiple edges between same nodes

## Performance Guidelines

1. **Prefer Procedure methods** over Expression equivalents
2. **Use $.forArray()** instead of `Filter()`/`Map()` expressions
3. **Use Sets for visited tracking** - O(1) lookup vs O(n) array search
4. **Use appropriate data structures** - Arrays for queues/stacks, Sets for visited, Dicts for adjacency
5. **Minimize allocations** - Reuse variables and mutate in-place with Procedure methods

## Template Usage

- **Individual procedures don't need Templates** - Export procedures directly: `export const myProcedure = new Procedure(...)`
- **Templates are for grouping** - Use `Template(proc1, proc2, ...)` only when exporting multiple procedures together
- **Tests need Templates** - UnitTestBuilder results must be wrapped in Template for execution

## TypeDoc Documentation Standards for Procedures

### Overview
All EDK Procedures must include comprehensive TypeDoc documentation that clearly explains the algorithm, inputs, outputs, complexity, and behavior. This ensures maintainability and helps users understand how to use procedures correctly.

### Required Documentation Sections

#### 1. **Title and Purpose**
```typescript
/**
 * [Algorithm Name] - [Brief description of what it does]
 * 
 * **Purpose**: Detailed explanation of the algorithm's purpose, use cases, and why it exists.
 * Include context about the problem domain (e.g., "for batch genealogy traceability").
 */
```

#### 3. **Key Assumptions**
```typescript
/**
 * **Key Assumptions**:
 * - Assumption 1: Description of what the algorithm assumes about inputs
 * - Assumption 2: Description of data structure expectations
 * - Assumption 3: Description of graph properties or constraints
 * - Assumption N: Any other critical assumptions
 */
```

#### 4. **Complexity Analysis** (Required)
```typescript
/**
 * **Time Complexity**: O(expression) where:
 * - Variable 1 = description of what this variable represents
 * - Variable 2 = description of what this variable represents
 * Note: Include details about optimizations and constant factor improvements
 * 
 * **Space Complexity**: O(expression) for:
 * - Component 1: description and complexity
 * - Component 2: description and complexity
 * - Include pre-computed structures and reusable data when applicable
 */
```

#### 5. **Input/Output Documentation** (Required)
```typescript
/**
 * **Input Parameters**:
 * @param paramName1 - Detailed description including data structure and constraints
 * @param paramName2 - Detailed description including data structure and constraints
 * 
 * **Output Structure**:
 * @returns ReturnType containing:
 * - field1: Description of this field and what it contains
 * - field2: Description of this field and what it contains
 * - fieldN: Description of any nested structures or special meanings
 */
```

#### 6. **Behavior Examples** (Highly Recommended)
```typescript
/**
 * **Behavior Examples**:
 * 
 * ```
 * Example 1: [Scenario Name]
 * Graph: [ASCII diagram or description]
 * Input: [specific input values]
 * Output: [expected output with explanation]
 *   [Additional details about why this output occurs]
 * 
 * Example 2: [Different Scenario]
 * Graph: [ASCII diagram or description] 
 * Input: [specific input values]
 * Output: [expected output with explanation]
 *   Note: [Any important observations about behavior]
 * ```
 */
```

#### 7. **Edge Cases** (Recommended)
```typescript
/**
 * **Edge Cases Handled**:
 * - Case 1: Description and how algorithm handles it
 * - Case 2: Description and how algorithm handles it
 * - Case N: Any other important edge cases
 */
```

#### 9. **Use Cases** (Optional but Recommended)
```typescript
/**
 * **Use Cases**:
 * - Use case 1: "Description of when to use this algorithm"
 * - Use case 2: "Description of practical application"
 * - Use case N: "Description of domain-specific scenarios"
 */
```

### Complete Example Template

```typescript
/**
 * [Algorithm Name] - [Brief description]
 * 
 * **Purpose**: [Detailed explanation of purpose and domain context]
 * 
 * **Key Assumptions**:
 * - [Assumption 1]
 * - [Assumption 2]
 * 
 * **Time Complexity**: O(expression) where:
 * - Variable = description
 * 
 * **Space Complexity**: O(expression) for:
 * - Component: description
 * 
 * **Input Parameters**:
 * @param param1 - Description
 * @param param2 - Description
 * 
 * **Output Structure**:
 * @returns ReturnType containing:
 * - field1: Description
 * - field2: Description
 * 
 * **Behavior Examples**:
 * ```
 * Example 1: [Scenario]
 * Input: [values]
 * Output: [result]
 * ```
 * 
 * **Edge Cases Handled**:
 * - [Case 1]: [How handled]
 * 
 * **Use Cases**:
 * - [Use case 1]: [Description]
 */
export const my_procedure = new Procedure("my_procedure")
  .input("param1", Type1)
  .input("param2", Type2)
  .output(ReturnType)
  .body(($, { param1, param2 }) => {
    // Implementation
  });
```

### TypeDoc Test Documentation Standards

For comprehensive test suites, use concise but clear documentation:

```typescript
/**
 * Test N: [Test Scenario Name]
 * Input: [Brief description of graph/inputs] | Output: [Expected result summary]
 */
const test_name = new UnitTestBuilder("test_name")
  .procedure(my_procedure)
  .test(input, expectedOutput);
```

### Documentation Quality Guidelines

1. **Clarity**: Write for someone unfamiliar with the algorithm
2. **Completeness**: Cover all major aspects of behavior
3. **Accuracy**: Ensure complexity analysis and examples are correct
4. **Consistency**: Follow the same structure across all procedures
5. **Examples**: Include realistic examples that demonstrate key features
6. **Maintenance**: Update documentation when algorithm changes

### Common Mistakes to Avoid

- **Missing complexity analysis**: Always include Big O notation
- **Vague parameter descriptions**: Be specific about data structures and constraints  
- **No edge case coverage**: Document how unusual inputs are handled
- **Outdated examples**: Keep examples synchronized with actual behavior
- **Generic descriptions**: Avoid copy-paste documentation that doesn't match the specific algorithm

## Procedure Design Patterns and Best Practices

### Reusing Core Algorithms vs Building Enhanced Variants

When building advanced procedures that extend basic algorithms (like tracked traversal vs basic traversal):

**When to Reuse:**
- The core algorithm logic is simple and well-tested
- You only need the final result, not intermediate metadata
- Post-processing can efficiently extract what you need

**When to Build Separate Procedures:**
- You need metadata collected **during** traversal (parent relationships, visit order, edge types)
- The enhanced version has different performance characteristics
- Post-processing would require re-traversing the graph

**Example: Tracked Traversal Design Decision**
```typescript
// ❌ WRONG: Trying to post-process basic BFS results
const basic_result = $.let(procs.graph_bfs(...));
// Problem: Can't reconstruct parent relationships or visit order from just node IDs

// ✅ CORRECT: Separate procedure that collects metadata during traversal
export const graph_tracked_bfs = new Procedure("graph_tracked_bfs")
  .import(graph_build_adjacency_lists)  // Reuse shared utilities
  .body(($, inputs, procs) => {
    // Custom BFS loop that tracks metadata as it goes
  });
```

### Managing Complex Data Structures

**Nested Dictionaries Pattern:**
```typescript
// For mapping: from_node -> to_node -> [edge_types]
const edgeTypeMap = $.let(NewDict(StringType, DictType(StringType, ArrayType(StringType))));

// Build nested structure incrementally
$.forArray(edges, ($, edge) => {
  const fromId = $.let(GetField(edge, "from"));
  const toId = $.let(GetField(edge, "to"));
  const edgeType = $.let(GetField(edge, "type"));
  
  $.if(In(edgeTypeMap, fromId)).then($ => {
    const toMap = $.let(Get(edgeTypeMap, fromId));
    $.if(In(toMap, toId)).then($ => {
      const edgeTypes = $.let(Get(toMap, toId));
      $.pushLast(edgeTypes, edgeType);
    }).else($ => {
      $.insert(toMap, toId, NewArray(StringType, [edgeType]));
    });
  }).else($ => {
    const newToMap = $.let(NewDict(StringType, ArrayType(StringType)));
    $.insert(newToMap, toId, NewArray(StringType, [edgeType]));
    $.insert(edgeTypeMap, fromId, newToMap);
  });
});
```

**Import Organization:**
```typescript
// Correct import patterns
import { DictType, Procedure } from "@elaraai/core";  // Core classes
import { ArrayType, IntegerType, StringType } from "@elaraai/core";  // Types
import { Add, Get, In, NewDict } from "@elaraai/core";  // Operations
```

### Procedure Naming Conventions

**Use descriptive prefixes that indicate behavior:**
- `graph_bfs` / `graph_dfs` - Basic algorithms returning node IDs
- `graph_tracked_bfs` / `graph_tracked_dfs` - Enhanced with metadata tracking
- `graph_subgraphs` - Extracts multiple subgraphs
- `graph_network_extraction` - Specialized network discovery

**Avoid generic terms:**
- ❌ `enhanced_traversal` - Generic, unclear what's enhanced
- ✅ `tracked_breadth_first` - Specific about what tracking is added
- ❌ `advanced_analysis` - Vague
- ✅ `type_aggregation` - Clear about the analysis type

### Test Coverage Strategy

**Comprehensive test scenarios for new procedures:**
1. **Basic functionality** - Simple linear cases
2. **Complex structures** - Diamonds, trees, cycles
3. **Edge cases** - Empty graphs, single nodes, disconnected components
4. **Edge type handling** - Multiple edges between same nodes
5. **Real-world scenarios** - Manufacturing workflows, dependency chains
6. **Performance characteristics** - Wide vs deep graphs

**Example test naming:**
```typescript
const tracked_bfs_diamond_test = new UnitTestBuilder("tracked_bfs_diamond")
const tracked_dfs_manufacturing_test = new UnitTestBuilder("tracked_dfs_manufacturing")
const tracked_bfs_multi_edges_test = new UnitTestBuilder("tracked_bfs_multi_edges")
```

### Critical Production Stress Tests

**ALWAYS include these test scenarios for production readiness:**

1. **Infinite Loop Prevention**
```typescript
// CRITICAL: Test actual cycles (not just self-loops)
const cycle_test = new UnitTestBuilder("procedure_cycle")
  .test({
    nodes: [{"A", "B", "C"}],
    edges: [A→B, B→C, C→A],  // Real cycle
    source_node_id: "A"
  }, expected_result);
```

2. **Invalid Input Handling**
```typescript
// Start node doesn't exist
.test({ nodes: [...], edges: [...], source_node_id: "NONEXISTENT" }, [])

// Dangling edges (reference missing nodes)
.test({ 
  nodes: [A, B], 
  edges: [A→B, A→MISSING, GHOST→B], 
  source_node_id: "A" 
}, expected_valid_only)
```

3. **Data Quality Issues**
```typescript
// Duplicate edges
.test({
  edges: [A→B, A→B, A→B]  // Same edge multiple times
}, handle_gracefully)

// Empty graph edge cases
.test({ nodes: [], edges: [], source_node_id: "any" }, [])
```

**Critical Bug Pattern Found:**
```typescript
// ❌ INFINITE LOOP BUG - Missing visited check in main loop
$.while(Greater(Size(queue), Const(0n)), $ => {
  const current = $.let(Get(queue, Const(0n)));
  $.deleteFirst(queue);
  // Missing: $.if(Not(In(visited, current))).then($ => { ... });
});

// ✅ CORRECT - Always check visited in main loop
$.while(Greater(Size(queue), Const(0n)), $ => {
  const current = $.let(Get(queue, Const(0n)));
  $.deleteFirst(queue);
  
  $.if(Not(In(visited, current))).then($ => {  // CRITICAL
    $.insert(visited, current);
    // ... rest of processing
  });
});
```

## Debugging and Logging

### Debug Logging in Procedures
```typescript
// Simple logging without variables
$.log(Const("Debug message"));

// Logging with variables using StringJoin template literals
$.log(StringJoin`Processing node: ${nodeId}`);
$.log(StringJoin`Stack size: ${Size(stack)} for node: ${nodeId}`);
$.log(StringJoin`Found ${Size(results)} results`);

// Multiple variables in one log
$.log(StringJoin`Node ${nodeId} has ${totalInflow} inflow and ${totalOutflow} outflow`);
```

### Running tests
To run a test you can use `edk template test`:

edk template test -t ts --path path_to_test

### Accessing Test Logs
When tests run, they create a temporary workspace. To access logs:

1. **Find the workspace ID** from test output: `Creating workspace test_3adcfa4d`
2. **Switch to that workspace**: `edk workspace switch test_3adcfa4d`
3. **Get logs for specific test**: `edk task logs Function.Test.test_name --raw`
   - Test names have `Function.Test.` prefix
   - Example: `edk task logs Function.Test.flow_conservation_losses --raw`

```bash
# Example workflow
make dagflow_conservation_tests  # Note the workspace ID in output
edk workspace switch test_3adcfa4d
edk task logs Function.Test.dynamic_reachability_basic --raw
```

### Debugging Procedure Execution Errors

When procedures fail, the error messages include **execution traces** that show exactly where the error occurred:

#### Understanding Error Stack Traces

**Error Format:**
```
Key "MISSING_NODE" not found in dictionary (in procedure graph_cycle_detection -> Statement 17 (for) -> Statement 8 (if true) -> Statement 4 (while) -> Statement 8 (if true) -> Statement 2 (if true) -> Statement 2 (for) -> Statement 1 (let var_17) -> Get)
```

**How to Read the Trace:**
- `procedure graph_cycle_detection` - The procedure that failed
- `Statement 17 (for)` - The 17th statement in the procedure body (a `$.forArray()`)
- `Statement 8 (if true)` - The 8th statement inside that for loop (a `$.if().then()`)
- `Statement 4 (while)` - The 4th statement inside that if block (a `$.while()`)
- `Statement 8 (if true)` - The 8th statement inside the while loop
- `Statement 2 (if true)` - The 2nd statement in that if block
- `Statement 2 (for)` - The 2nd statement (another `$.forArray()`)
- `Statement 1 (let var_17)` - The 1st statement in that for loop (a `$.let()`)
- `Get` - The specific operation that failed (a `Get()` expression)

#### Debugging Strategy

1. **Count Statements**: Find the failing statement by counting procedure statements from the top
2. **Follow the Nesting**: Trace through nested control structures (for/if/while)
3. **Identify the Operation**: The last item is the specific operation that failed

**Example Debug Process:**
```typescript
export const graph_cycle_detection = new Procedure("graph_cycle_detection")
  .body(($, { nodes, edges }) => {
    // Statement 1: const nodeCount = ...
    // Statement 2: const edgeCount = ...
    // ...
    // Statement 17: THIS IS THE FAILING $.forArray()
    $.forArray(nodes, ($, node, nodeIndex, outerLabel) => {
      // Statement 1 (inside for): Early exit check
      // Statement 2, 3, 4, 5, 6, 7...
      // Statement 8: THIS IS THE FAILING $.if()
      $.if(Equal(nodeColor, Const(0n))).then($ => {
        // Statement 1, 2, 3...
        // Statement 4: THIS IS THE FAILING $.while()
        $.while(Greater(Size(stack), Const(0n)), $ => {
          // ... trace continues into while loop
          $.forArray(neighbors, ($, neighbor) => {
            // Statement 1: THIS IS WHERE Get() FAILED
            const neighborColor = $.let(Get(color, neighbor)); // ❌ MISSING_NODE not in color dict
          });
        });
      });
    });
  });
```

#### Common Error Patterns

**Dictionary Key Errors:**
- **Cause**: `Get()` operations on missing keys
- **Solution**: Add `In()` checks before `Get()`
- **Example**: `$.if(In(dict, key)).then($ => { const value = $.let(Get(dict, key)); })`

**Array Index Errors:**
- **Cause**: Accessing array indices that don't exist
- **Solution**: Check `Size()` before accessing indices
- **Example**: `$.if(Greater(Size(array), index)).then(...)`

**Null Reference Errors:**
- **Cause**: Operations on null/undefined values
- **Solution**: Use `$.ifNull()` for safe handling
- **Example**: `$.ifNull(value).then($ => { /* null case */ }).else(($, nonNull) => { /* use nonNull */ })`

### Array Reference vs Copy - Critical Pattern

**⚠️ IMPORTANT**: When getting arrays from dictionaries for iteration, you MUST use `ToArray()` to make a copy. Otherwise, you get a reference that can be modified during iteration, causing silent bugs.

## DateTime Operations

### Duration Calculations
```typescript
// Calculate duration between two dates
const durationInMinutes = $.let(Duration(startTime, endTime, "minute"));
const durationInHours = $.let(Duration(startTime, endTime, "hour"));
const durationInDays = $.let(Duration(startTime, endTime, "day"));

// Available time units: 'millisecond', 'second', 'minute', 'hour', 'day', 'week'
```

### Date Arithmetic
```typescript
// Add duration to a date
const futureDate = $.let(AddDuration(currentDate, Const(30.0), "day"));
const laterTime = $.let(AddDuration(currentTime, Const(2.5), "hour"));

// Subtract duration from a date  
const pastDate = $.let(SubtractDuration(currentDate, Const(7.0), "day"));
const earlierTime = $.let(SubtractDuration(currentTime, Const(90.0), "minute"));
```

### Timezone Conversions
```typescript
// Convert between timezones
const localTime = $.let(TimeZoneConvert(utcTime, "Etc/UTC", "America/New_York"));
const utcTime = $.let(TimeZoneConvert(localTime, "America/New_York", "Etc/UTC"));
```

### Date Components
```typescript
// Extract components from dates
const year = $.let(Year(dateTime));           // 2024
const month = $.let(Month(dateTime));         // 1-12 (January = 1)
const dayOfMonth = $.let(DayOfMonth(dateTime)); // 1-31
const dayOfWeek = $.let(DayOfWeek(dateTime)); // 0-6 (Monday = 0)
const hour = $.let(Hour(dateTime));           // 0-23
const minute = $.let(Minute(dateTime));       // 0-59
const second = $.let(Second(dateTime));       // 0-59
```

```typescript
// ❌ WRONG: Gets a reference that can be corrupted during iteration
const parents = $.let(Get(reverseAdjacencyList, current, NewArray(StringType)));
const stack = $.let(Get(adjacencyList, nodeId, NewArray(StringType)));

// ✅ CORRECT: Creates a copy that won't be affected by mutations  
const parents = $.let(ToArray(Get(reverseAdjacencyList, current, NewArray(StringType))));
const stack = $.let(ToArray(Get(adjacencyList, nodeId, NewArray(StringType))));
```

**Why this matters:**
- Dictionary arrays are mutable references
- During DFS traversal, array modifications can affect other iterations
- Symptoms: Missing transitive relationships, incomplete traversals
- Always use `ToArray()` when getting arrays from dictionaries for traversal

**Import requirement:**
```typescript
import { ToArray } from "@elaraai/core";
```

## Common Patterns and Gotchas

### DictType Test Data
```typescript
// CORRECT: Use Map constructor for DictType values in tests
const testNode = { 
    id: "A", 
    value: new Map([["volume", 100.0], ["quality", 0.8], ["cost", 50.0]]) 
};

// WRONG: Object literals don't work for DictType
const testNode = { 
    id: "A", 
    value: { "volume": 100.0, "quality": 0.8, "cost": 50.0 } // Invalid!
};
```

### Generic Dictionary Processing
```typescript
// Process any dictionary keys without hardcoding assumptions
$.forDict(nodeValueDict, ($, value, key) => {
    const existingValue = $.let(Get(resultDict, key, Const(0.0)));
    $.insertOrUpdate(resultDict, key, Add(existingValue, value));
});

// AVOID: Hardcoding specific keys
const volume = $.let(Get(dict, Const("volume"))); // Don't assume keys exist
```

### Type Safety with Graph Nodes
```typescript
// Always include required fields in type definitions
export const MyNode = StructType({
    id: StringType,        // Always required for graph algorithms
    type: StringType,      // Include if algorithms need to access it
    // ... other fields
});
```

## Graph Statistics Procedures

### Type vs Path Statistics

The DAG library provides two complementary approaches to graph analysis:

#### **Type Statistics** (`graph_type_statistics`)
- **Purpose**: Fast type-based analysis without expensive traversal
- **Complexity**: O(N + E) - single pass through nodes and edges
- **Use Cases**: 
  - Quick graph profiling: "What types of operations are present?"
  - Interface identification: "What are the entry and exit points?"
  - Type distribution analysis: "How many nodes of each type?"

```typescript
import { graph_type_statistics } from "./aggregation/type_statistics";

const typeStats = graph_type_statistics({ nodes, edges });
// Returns: node_count, edge_count, node_types, source_node_types, 
//          target_node_types, unique_node_types_count, aggregate_nodes, aggregate_edges
```

#### **Path Statistics** (`graph_path_statistics`)
- **Purpose**: Comprehensive path analysis using graph traversal
- **Complexity**: O(V + E) per source node - uses BFS traversal
- **Use Cases**:
  - Process flow analysis: "What's the longest execution path?"
  - Complexity assessment: "How deep and branched is this workflow?"
  - Pattern recognition: "What are the typical operation sequences?"

```typescript
import { graph_path_statistics } from "./aggregation/path_statistics";

const pathStats = graph_path_statistics({ nodes, edges });
// Returns: node_count, edge_count, path_length, max_depth, 
//          branching_factor, node_type_sequence
```

### When to Use Which

**Use Type Statistics when:**
- You need quick insights about graph structure
- Performance is critical (large graphs)
- You're analyzing type patterns and distributions
- You don't need detailed path information

**Use Path Statistics when:**
- You need to understand actual execution flows
- Path depth and complexity matter for your analysis
- You're looking for bottlenecks or critical paths
- You need pattern signatures for workflow classification

### Example: Workflow Analysis Pipeline

```typescript
// Quick assessment first
const typeStats = graph_type_statistics({ nodes, edges });
console.log(`Graph has ${typeStats.unique_node_types_count} types`);
console.log(`Sources: ${typeStats.source_node_types}, Targets: ${typeStats.target_node_types}`);

// Detailed analysis if needed
if (typeStats.node_count > 100) {
  console.log("Large graph detected, skipping detailed path analysis");
} else {
  const pathStats = graph_path_statistics({ nodes, edges });
  console.log(`Max depth: ${pathStats.max_depth}, Complexity: ${pathStats.branching_factor}`);
  console.log(`Typical flow: ${pathStats.node_type_sequence.join(" → ")}`);
}
```