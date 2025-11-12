package com.nexhubstudio.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.nexhubstudio.backend.mapper")
public class NexHubStudioApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexHubStudioApplication.class, args);
    }
}
