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
  .input("startId", StringType)
  .output(ArrayType(StringType))
  .body(($, { nodes, edges, startId }) => {
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
    const queue = $.let(NewArray(StringType, [startId]));
    const visited = $.let(NewSet(StringType, [startId]));
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
  .input("startId", StringType)
  .output(ArrayType(StringType))
  .body(($, { nodes, edges, startId }) => {
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
    const stack = $.let(NewArray(StringType, [startId]));
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