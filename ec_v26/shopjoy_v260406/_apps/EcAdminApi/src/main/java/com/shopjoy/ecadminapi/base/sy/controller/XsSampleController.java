package com.shopjoy.ecadminapi.base.sy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/xs-sample")
@RequiredArgsConstructor
public class XsSampleController {

    private final ObjectMapper objectMapper;

    /**
     * 샘플 데이터 조회
     * @param num 샘플 번호 (01, 02, 04, 05, 06, 07, 08, 09)
     * @return JSON 샘플 데이터
     */
    @GetMapping("/{num}")
    public ResponseEntity<ApiResponse<Map>> getSampleData(@PathVariable String num) {
        try {
            String resourcePath = "/sample" + num + ".json";
            InputStream inputStream = this.getClass().getResourceAsStream(resourcePath);
            
            if (inputStream == null) {
                return ResponseEntity.notFound().build();
            }

            Map data = objectMapper.readValue(inputStream, Map.class);
            inputStream.close();

            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to load sample data: " + e.getMessage()));
        }
    }
}
