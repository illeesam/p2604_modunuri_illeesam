-- flyway_schema_history 테이블 DDL

CREATE TABLE shopjoy_2604.flyway_schema_history (
    installed_rank INTEGER       NOT NULL CONSTRAINT flyway_schema_history_pk_installed_rank PRIMARY KEY,
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


CREATE INDEX flyway_schema_history_ix01_success ON shopjoy_2604.flyway_schema_history USING btree (success);
