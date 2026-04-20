package com.shopjoy.ecadminapi.autorest.comn;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class TableConfig {
    /** Primary key column name, e.g. "user_id" */
    private String pkColumn;

    /** Fields required on create/update */
    @Builder.Default
    private List<String> requiredFields = List.of();

    /** Maps column name -> code group, e.g. "user_status_cd" -> "USER_STATUS" */
    @Builder.Default
    private Map<String, String> cdFields = Map.of();

    /** Maps FK column -> target table, e.g. "site_id" -> "sy_site" */
    @Builder.Default
    private Map<String, String> fkFields = Map.of();

    /** Child tables to include in getById response */
    @Builder.Default
    private List<String> childTables = List.of();

    /** Columns that can be searched via keyword */
    @Builder.Default
    private List<String> searchFields = List.of();

    /** Default date column for date range filter */
    @Builder.Default
    private String dateField = "reg_date";
}
