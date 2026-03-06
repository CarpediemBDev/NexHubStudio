package com.nexhubstudio.backend.security.xss;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;

/**
 * XSS 방어를 위한 Jackson JsonDeserializer
 * application/json (@RequestBody) 형태로 들어오는 문자열 데이터의 HTML을 이스케이프 처리합니다.
 */
public class XssStringJsonDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        String name = p.getParsingContext().getCurrentName();
        String value = p.getValueAsString();

        if (StringUtils.hasText(value)) {
            // 비밀번호 필드는 이스케이프 처리 제외
            if (name != null && name.toLowerCase().contains("password")) {
                return value;
            }
            return HtmlUtils.htmlEscape(value);
        }
        return value;
    }
}
