package com.nexhubstudio.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class BarcodeProxyService {
    @Autowired
    private RestTemplate restTemplate;

    // 데몬 서버에서 바코드 가격 조회
    public String fetchPriceFromBarcodeDaemon(String code) {
        String daemonUrl = "http://localhost:3001/api/price?code=" + code;
        return restTemplate.getForObject(daemonUrl, String.class);
    }
}
