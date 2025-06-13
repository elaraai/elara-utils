.PHONY: all
all: dag_aggregation_tests dag_flow_conservation_tests dag_time_aggregation_tests dag_shared_utils_tests dag_path_analysis_tests dag_graph_traversal_tests

# Aggregation tests
.PHONY: dag_aggregation_tests
dag_aggregation_tests: dag_aggregation_bottom_up_tests dag_aggregation_top_down_tests dag_aggregation_weighted_tests dag_aggregation_group_value_tests dag_aggregation_by_type_tests dag_aggregation_type_statistics_tests dag_aggregation_path_statistics_tests

.PHONY: dag_aggregation_bottom_up_tests
dag_aggregation_bottom_up_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_bottom_up_tests.ts

.PHONY: dag_aggregation_top_down_tests
dag_aggregation_top_down_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_top_down_tests.ts

.PHONY: dag_aggregation_weighted_tests
dag_aggregation_weighted_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_weighted_tests.ts

.PHONY: dag_aggregation_group_value_tests
dag_aggregation_group_value_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_group_value_tests.ts

.PHONY: dag_aggregation_by_type_tests
dag_aggregation_by_type_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_by_type_tests.ts

.PHONY: dag_aggregation_type_statistics_tests
dag_aggregation_type_statistics_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_type_statistics_tests.ts

.PHONY: dag_aggregation_path_statistics_tests
dag_aggregation_path_statistics_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_path_statistics_tests.ts

# Graph traversal tests
.PHONY: dag_graph_traversal_tests
dag_graph_traversal_tests: dag_graph_traversal_bfs_tests dag_graph_traversal_dfs_tests dag_graph_traversal_enhanced_tests dag_graph_traversal_topological_tests dag_graph_traversal_cycle_detection_tests dag_graph_traversal_ancestor_descendant_tests

.PHONY: dag_graph_traversal_bfs_tests
dag_graph_traversal_bfs_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_bfs_tests.ts

.PHONY: dag_graph_traversal_dfs_tests
dag_graph_traversal_dfs_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_dfs_tests.ts

.PHONY: dag_graph_traversal_enhanced_tests
dag_graph_traversal_enhanced_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_enhanced_tests.ts

.PHONY: dag_graph_traversal_topological_tests
dag_graph_traversal_topological_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_topological_tests.ts

.PHONY: dag_graph_traversal_cycle_detection_tests
dag_graph_traversal_cycle_detection_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_cycle_detection_tests.ts

.PHONY: dag_graph_traversal_ancestor_descendant_tests
dag_graph_traversal_ancestor_descendant_tests:
	edk template test -t ts --path src/dag/__tests/graph_traversal_ancestor_descendant_tests.ts

# Flow conservation tests
.PHONY: dag_flow_conservation_tests
dag_flow_conservation_tests: dag_flow_conservation_basic_tests dag_flow_conservation_reachability_tests dag_flow_conservation_components_tests

.PHONY: dag_flow_conservation_basic_tests
dag_flow_conservation_basic_tests:
	edk template test -t ts --path src/dag/__tests/flow_conservation_tests.ts

.PHONY: dag_flow_conservation_reachability_tests
dag_flow_conservation_reachability_tests:
	edk template test -t ts --path src/dag/__tests/flow_conservation_reachability_tests.ts

.PHONY: dag_flow_conservation_components_tests
dag_flow_conservation_components_tests:
	edk template test -t ts --path src/dag/__tests/flow_conservation_components_tests.ts

# Time aggregation tests
.PHONY: dag_time_aggregation_tests
dag_time_aggregation_tests: dag_time_aggregation_bottom_up_tests dag_time_aggregation_top_down_tests

.PHONY: dag_time_aggregation_bottom_up_tests
dag_time_aggregation_bottom_up_tests:
	edk template test -t ts --path src/dag/__tests/time_aggregation_bottom_up_tests.ts

.PHONY: dag_time_aggregation_top_down_tests
dag_time_aggregation_top_down_tests:
	edk template test -t ts --path src/dag/__tests/time_aggregation_top_down_tests.ts

# Shared utils tests
.PHONY: dag_shared_utils_tests
dag_shared_utils_tests: dag_shared_utils_adjacency_tests dag_shared_utils_validate_tests

.PHONY: dag_shared_utils_adjacency_tests
dag_shared_utils_adjacency_tests:
	edk template test -t ts --path src/dag/__tests/shared_utils_adjacency_tests.ts

.PHONY: dag_shared_utils_validate_tests
dag_shared_utils_validate_tests:
	edk template test -t ts --path src/dag/__tests/shared_utils_validate_tests.ts

# Path analysis tests
.PHONY: dag_path_analysis_tests
dag_path_analysis_tests: dag_path_analysis_all_paths_tests dag_path_analysis_membership_tests dag_path_analysis_shortest_path_tests dag_path_analysis_critical_path_tests dag_path_analysis_subgraphs_tests

.PHONY: dag_path_analysis_all_paths_tests
dag_path_analysis_all_paths_tests:
	edk template test -t ts --path src/dag/__tests/path_analysis_all_paths_tests.ts

.PHONY: dag_path_analysis_membership_tests
dag_path_analysis_membership_tests:
	edk template test -t ts --path src/dag/__tests/path_analysis_membership_tests.ts

.PHONY: dag_path_analysis_shortest_path_tests
dag_path_analysis_shortest_path_tests:
	edk template test -t ts --path src/dag/__tests/path_analysis_shortest_path_tests.ts

.PHONY: dag_path_analysis_critical_path_tests
dag_path_analysis_critical_path_tests:
	edk template test -t ts --path src/dag/__tests/path_analysis_critical_path_tests.ts

.PHONY: dag_path_analysis_subgraphs_tests
dag_path_analysis_subgraphs_tests:
	edk template test -t ts --path src/dag/__tests/path_analysis_subgraphs_tests.ts
