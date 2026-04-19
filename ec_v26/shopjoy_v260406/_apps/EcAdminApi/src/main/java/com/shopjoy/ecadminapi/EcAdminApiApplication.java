package com.shopjoy.ecadminapi;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.shopjoy.ecadminapi.autorest")
public class EcAdminApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcAdminApiApplication.class, args);
    }
}
