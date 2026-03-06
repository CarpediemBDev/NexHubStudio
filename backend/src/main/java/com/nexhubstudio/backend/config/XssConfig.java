package com.nexhubstudio.backend.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.nexhubstudio.backend.security.xss.XssStringJsonDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class XssConfig {

    /**
     * Jackson ObjectMapper 커스터마이징 모듈 등록
     * \@RequestBody로 들어오는 JSON 데이터의 String 필드에 대해 XSS 이스케이프를 적용합니다.
     */
    @Bean
    public SimpleModule xssModule() {
        SimpleModule xssModule = new SimpleModule("XssModule");
        // String 타입의 필드를 역직렬화할 때 XssStringJsonDeserializer를 거치도록 설정합니다.
        xssModule.addDeserializer(String.class, new XssStringJsonDeserializer());
        return xssModule;
    }
}
