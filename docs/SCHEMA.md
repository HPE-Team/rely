# Schema Documentation

## Table: zones

| Column Name | Data Type | Description |
| --- | --- | --- |
| zone_id | VARCHAR(20) (PK) | Unique identifier for each availability zone (zone-a, zone-b, zone-c, zone-d). |

## Table: compute_server2

| Column Name | Data Type | Description |
| --- | --- | --- |
| id | INT (AUTO_INCREMENT, PK) | Unique identifier for each record (host or VM). |
| parent_server_id | INT (NULLABLE) | References host ID for VMs; NULL for HOST nodes. |
| node_type | ENUM | Type of node: either a physical host or a virtual machine. |
| status | ENUM | Final provisioning status of the node. |
| status_percent | DECIMAL(5,2) (NULLABLE) | Indicates health of the machine. |
| provision_percent | DECIMAL(5,2) | Percentage completion of provisioning (100 if successful, partial/0 if failed). |
| status_message | TEXT | Human-readable provisioning result message. |
| error_type | ENUM (NULLABLE) | Error category if provisioning failed. |
| error_message | VARCHAR(255) (NULLABLE) | Error reason if provisioning failed (e.g., hardware failure, host failure, power off). |
| provision_time | FLOAT | Time taken (in seconds) to provision the node. |
| status_date | DATETIME | Timestamp when provisioning status was recorded. |
| max_memory | INT | Maximum memory allocated (MB); fixed for hosts, variable for VMs. |
| max_cores | INT | Number of CPU cores; fixed for hosts, variable for VMs. |
| max_storage | INT | Storage capacity (GB). |
| power_state | VARCHAR(10) | Power state of the node ('on' or 'off'); affects failure logic. |
| zone_id | VARCHAR(20) (FK -> zones.zone_id) | Availability zone identifier (zone-a, zone-b, zone-c, zone-d). |

## Table: zone_metrics

| Column Name | Data Type | Description |
| --- | --- | --- |
| id | BIGINT (AUTO_INCREMENT, PK) | Unique identifier for each zone metrics snapshot. |
| zone_id | VARCHAR(20) (FK -> zones.zone_id) | References the zone for which metrics were calculated. |
| calculated_at | DATETIME | Timestamp when the metrics snapshot was calculated. |
| pri_score | DECIMAL(8,4) | PRI score for the zone at that time. |
| success_rate | DECIMAL(8,4) | Fraction of records in the zone that were provisioned successfully. |
| failure_rate | DECIMAL(8,4) | Fraction of records in the zone that failed provisioning. |
| avg_provision_time | DECIMAL(10,2) | Average provision time (in seconds) for the zone. |
| stability_score | DECIMAL(8,4) | Score derived from variation in provision times. |
| dependency_penalty | DECIMAL(8,4) | Penalty based on failures caused by host dependency. |
| latency_penalty | DECIMAL(8,4) | Penalty applied for slow provisioning even when successful. |

## Enums

| Column | Allowed Values |
| --- | --- |
| compute_server2.node_type | 'HOST', 'VM' |
| compute_server2.status | 'provisioned', 'failed' |
| compute_server2.error_type | 'HARDWARE_FAILURE', 'RESOURCE_FAILURE', 'STORAGE_FAILURE', 'NETWORK_FAILURE', 'IP_FAILURE', 'POWER_FAILURE', 'HOST_FAILURE' |

## Constraints

| Constraint | Definition | Description |
| --- | --- | --- |
| uq_zone_metrics | UNIQUE(zone_id, calculated_at) | Prevents duplicate metric snapshots for the same zone at the same timestamp. |
| fk_compute_server2_zone_id | FOREIGN KEY (zone_id) REFERENCES zones(zone_id) | Ensures every compute_server2 record references a valid zone. |
| fk_zone_metrics_zone_id | FOREIGN KEY (zone_id) REFERENCES zones(zone_id) | Ensures every zone_metrics record references a valid zone. |

## Indexes

| Index | Definition | Description |
| --- | --- | --- |
| PRIMARY | zones(zone_id) | Primary key index for zones. |
| PRIMARY | compute_server2(id) | Primary key index for compute_server2. |
| PRIMARY | zone_metrics(id) | Primary key index for zone_metrics. |
| uq_zone_metrics | UNIQUE(zone_id, calculated_at) | Unique index used to prevent duplicate zone metric snapshots. |
