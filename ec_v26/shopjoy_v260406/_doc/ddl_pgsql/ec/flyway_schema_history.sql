-- flyway_schema_history 테이블 DDL

CREATE TABLE shopjoy_2604.flyway_schema_history (
    installed_rank INTEGER       NOT NULL PRIMARY KEY,
    version        VARCHAR(50)  ,
    description    VARCHAR(200)  NOT NULL,
    type           VARCHAR(20)   NOT NULL,
    script         VARCHAR(1000) NOT NULL,
    checksum       INTEGER      ,
    installed_by   VARCHAR(100)  NOT NULL,
    installed_on   TIMESTAMP     NOT NULL DEFAULT now(),
    execution_time INTEGER       NOT NULL,
    success        BOOLEAN       NOT NULL
);


CREATE UNIQUE INDEX flyway_schema_history_pk ON shopjoy_2604.flyway_schema_history USING btree (installed_rank);
CREATE INDEX flyway_schema_history_s_idx ON shopjoy_2604.flyway_schema_history USING btree (success);
