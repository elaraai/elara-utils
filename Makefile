.PHONY: all
all: dag_core_tests dag_traversal_tests dag_connectivity_tests dag_paths_tests dag_aggregation_tests dag_analysis_tests dag_flow_tests

# Core tests
.PHONY: dag_core_tests
dag_core_tests: dag_core_adjacency_lists_tests dag_core_validation_tests

.PHONY: dag_core_adjacency_lists_tests
dag_core_adjacency_lists_tests:
	edk template test -t ts --path src/dag/__tests/core_adjacency_lists_tests.ts

.PHONY: dag_core_validation_tests
dag_core_validation_tests:
	edk template test -t ts --path src/dag/__tests/core_validation_tests.ts

# Traversal tests
.PHONY: dag_traversal_tests
dag_traversal_tests: dag_traversal_breadth_first_tests dag_traversal_depth_first_tests dag_traversal_ancestor_descendant_tests dag_traversal_cycle_detection_tests dag_traversal_tracked_breadth_first_tests dag_traversal_tracked_depth_first_tests dag_traversal_topological_sort_tests

.PHONY: dag_traversal_breadth_first_tests
dag_traversal_breadth_first_tests:
	edk template test -t ts --path src/dag/__tests/traversal_breadth_first_tests.ts

.PHONY: dag_traversal_depth_first_tests
dag_traversal_depth_first_tests:
	edk template test -t ts --path src/dag/__tests/traversal_depth_first_tests.ts

.PHONY: dag_traversal_ancestor_descendant_tests
dag_traversal_ancestor_descendant_tests:
	edk template test -t ts --path src/dag/__tests/traversal_ancestor_descendant_tests.ts

.PHONY: dag_traversal_cycle_detection_tests
dag_traversal_cycle_detection_tests:
	edk template test -t ts --path src/dag/__tests/traversal_cycle_detection_tests.ts

.PHONY: dag_traversal_tracked_breadth_first_tests
dag_traversal_tracked_breadth_first_tests:
	edk template test -t ts --path src/dag/__tests/traversal_tracked_breadth_first_tests.ts

.PHONY: dag_traversal_tracked_depth_first_tests
dag_traversal_tracked_depth_first_tests:
	edk template test -t ts --path src/dag/__tests/traversal_tracked_depth_first_tests.ts

.PHONY: dag_traversal_topological_sort_tests
dag_traversal_topological_sort_tests:
	edk template test -t ts --path src/dag/__tests/traversal_topological_sort_tests.ts

# Connectivity tests
.PHONY: dag_connectivity_tests
dag_connectivity_tests: dag_connectivity_connected_components_tests dag_connectivity_dynamic_reachability_tests dag_connectivity_bridge_analysis_tests

.PHONY: dag_connectivity_connected_components_tests
dag_connectivity_connected_components_tests:
	edk template test -t ts --path src/dag/__tests/connectivity_connected_components_tests.ts

.PHONY: dag_connectivity_dynamic_reachability_tests
dag_connectivity_dynamic_reachability_tests:
	edk template test -t ts --path src/dag/__tests/connectivity_dynamic_reachability_tests.ts

.PHONY: dag_connectivity_bridge_analysis_tests
dag_connectivity_bridge_analysis_tests:
	edk template test -t ts --path src/dag/__tests/connectivity_bridge_analysis_tests.ts

# Paths tests
.PHONY: dag_paths_tests
dag_paths_tests: dag_paths_all_paths_tests dag_paths_critical_path_tests dag_paths_path_membership_tests dag_paths_shortest_path_tests dag_paths_subgraph_extraction_tests

.PHONY: dag_paths_all_paths_tests
dag_paths_all_paths_tests:
	edk template test -t ts --path src/dag/__tests/paths_all_paths_tests.ts

.PHONY: dag_paths_critical_path_tests
dag_paths_critical_path_tests:
	edk template test -t ts --path src/dag/__tests/paths_critical_path_tests.ts

.PHONY: dag_paths_path_membership_tests
dag_paths_path_membership_tests:
	edk template test -t ts --path src/dag/__tests/paths_path_membership_tests.ts

.PHONY: dag_paths_shortest_path_tests
dag_paths_shortest_path_tests:
	edk template test -t ts --path src/dag/__tests/paths_shortest_path_tests.ts

.PHONY: dag_paths_subgraph_extraction_tests
dag_paths_subgraph_extraction_tests:
	edk template test -t ts --path src/dag/__tests/paths_subgraph_extraction_tests.ts

# Aggregation tests
.PHONY: dag_aggregation_tests
dag_aggregation_tests: dag_aggregation_bottom_up_tests dag_aggregation_top_down_tests dag_aggregation_weighted_tests dag_aggregation_group_values_tests dag_aggregation_temporal_bottom_up_tests dag_aggregation_temporal_top_down_tests

.PHONY: dag_aggregation_bottom_up_tests
dag_aggregation_bottom_up_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_bottom_up_tests.ts

.PHONY: dag_aggregation_top_down_tests
dag_aggregation_top_down_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_top_down_tests.ts

.PHONY: dag_aggregation_weighted_tests
dag_aggregation_weighted_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_weighted_tests.ts

.PHONY: dag_aggregation_group_values_tests
dag_aggregation_group_values_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_group_values_tests.ts

.PHONY: dag_aggregation_temporal_bottom_up_tests
dag_aggregation_temporal_bottom_up_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_temporal_bottom_up_tests.ts

.PHONY: dag_aggregation_temporal_top_down_tests
dag_aggregation_temporal_top_down_tests:
	edk template test -t ts --path src/dag/__tests/aggregation_temporal_top_down_tests.ts

# Analysis tests
.PHONY: dag_analysis_tests
dag_analysis_tests: dag_analysis_type_aggregation_tests dag_analysis_type_statistics_tests dag_analysis_path_statistics_tests dag_analysis_missing_transitions_tests dag_analysis_workflow_completeness_tests

.PHONY: dag_analysis_type_aggregation_tests
dag_analysis_type_aggregation_tests:
	edk template test -t ts --path src/dag/__tests/analysis_type_aggregation_tests.ts

.PHONY: dag_analysis_type_statistics_tests
dag_analysis_type_statistics_tests:
	edk template test -t ts --path src/dag/__tests/analysis_type_statistics_tests.ts

.PHONY: dag_analysis_path_statistics_tests
dag_analysis_path_statistics_tests:
	edk template test -t ts --path src/dag/__tests/analysis_path_statistics_tests.ts

.PHONY: dag_analysis_missing_transitions_tests
dag_analysis_missing_transitions_tests:
	edk template test -t ts --path src/dag/__tests/analysis_missing_transitions_tests.ts

.PHONY: dag_analysis_workflow_completeness_tests
dag_analysis_workflow_completeness_tests:
	edk template test -t ts --path src/dag/__tests/analysis_workflow_completeness_tests.ts

# Flow tests
.PHONY: dag_flow_tests
dag_flow_tests: dag_flow_volume_flow_tests

.PHONY: dag_flow_volume_flow_tests
dag_flow_volume_flow_tests:
	edk template test -t ts --path src/dag/__tests/volume_flow_tests.ts
