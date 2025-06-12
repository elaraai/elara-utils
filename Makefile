.PHONY: all
all: dag_aggregation_tests dag_flow_conservation_tests dag_time_aggregation_tests dag_shared_utils_tests dag_path_analysis_tests dag_graph_traversal_tests

.PHONY: dag_aggregation_tests
dag_aggregation_tests:
	edk template test -t ts --path src/dag/aggregation_tests.ts

.PHONY: dag_flow_conservation_tests
dag_flow_conservation_tests:
	edk template test -t ts --path src/dag/flow_conservation_tests.ts

.PHONY: dag_time_aggregation_tests
dag_time_aggregation_tests:
	edk template test -t ts --path src/dag/time_aggregation_tests.ts

.PHONY: dag_shared_utils_tests
dag_shared_utils_tests:
	edk template test -t ts --path src/dag/shared_utils_tests.ts

.PHONY: dag_path_analysis_tests
dag_path_analysis_tests:
	edk template test -t ts --path src/dag/path_analysis_tests.ts

.PHONY: dag_graph_traversal_tests
dag_graph_traversal_tests:
	edk template test -t ts --path src/dag/graph_traversal_tests.ts
