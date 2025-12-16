package com.nexhubstudio.backend.controller;

import com.nexhubstudio.backend.service.BarcodeProxyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeProxyController {
    @Autowired
    private BarcodeProxyService barcodeProxyService;

    // 바코드 가격 조회 프록시
    @GetMapping("/price")
    public String getBarcodePrice(@RequestParam String code) {
        return barcodeProxyService.fetchPriceFromBarcodeDaemon(code);
    }
}
