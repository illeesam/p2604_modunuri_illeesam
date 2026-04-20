package com.shopjoy.ecadminapi;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan(
    basePackages = {"com.shopjoy.ecadminapi.autorest", "com.shopjoy.ecadminapi.base"},
    annotationClass = Mapper.class
)
public class EcAdminApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcAdminApiApplication.class, args);
    }
}
