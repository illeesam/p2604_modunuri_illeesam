package com.shopjoy.ecadminapi.co.ext.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * 외부 연동 — AI 챗봇 (OpenAI / Claude)  /api/co/ext/ai-chat
 */
@Slf4j
@RestController
@RequestMapping("/api/co/ext/ai-chat")
@RequiredArgsConstructor
public class CoExtAiChatController {

    private final SyPropRepository syPropRepository;
    private final ObjectMapper objectMapper;

    /** POST /api/co/ext/ai-chat/chat */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody Map<String, Object> body) {
        String provider     = str(body, "provider");
        String model        = str(body, "model");
        String systemPrompt = str(body, "systemPrompt");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) body.getOrDefault("messages", List.of());
        int maxTokens       = toInt(body.get("maxTokens"), 512);
        double temperature  = toDouble(body.get("temperature"), 0.7);

        // sy_prop 에서 API 키 조회
        Map<String, String> propMap = new HashMap<>();
        syPropRepository.findAll().stream()
                .filter(p -> "app.ai.openai.api-key".equals(p.getPropKey())
                          || "app.ai.claude.api-key".equals(p.getPropKey()))
                .forEach(p -> propMap.put(p.getPropKey(), p.getPropValue()));

        try {
            if ("claude".equalsIgnoreCase(provider)) {
                return callClaude(propMap, model, systemPrompt, messages, maxTokens);
            } else {
                return callOpenAi(propMap, model, systemPrompt, messages, maxTokens, temperature);
            }
        } catch (Exception e) {
            log.error("[CoExtAiChat] 호출 실패 provider={}: {}", provider, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(500, e.getMessage(), null));
        }
    }

    // ── OpenAI Chat Completions ───────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private ResponseEntity<ApiResponse<Map<String, Object>>> callOpenAi(
            Map<String, String> propMap, String model, String systemPrompt,
            List<Map<String, Object>> userMessages, int maxTokens, double temperature) throws Exception {

        String apiKey = propMap.get("app.ai.openai.api-key");
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.ok(ApiResponse.error(400,
                    "API 키가 설정되지 않았습니다 (sy_prop: app.ai.openai.api-key)", null));
        }
        if (model == null || model.isBlank()) model = "gpt-4o-mini";

        List<Map<String, Object>> msgList = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            msgList.add(Map.of("role", "system", "content", systemPrompt));
        }
        msgList.addAll(userMessages);

        Map<String, Object> reqBody = new LinkedHashMap<>();
        reqBody.put("model", model);
        reqBody.put("messages", msgList);
        reqBody.put("max_tokens", maxTokens);
        reqBody.put("temperature", temperature);

        String responseBody = RestClient.create()
                .post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(reqBody)
                .retrieve()
                .body(String.class);

        Map<String, Object> resp = objectMapper.readValue(responseBody, Map.class);

        String content = "";
        List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.get("choices");
        if (choices != null && !choices.isEmpty()) {
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message != null) content = (String) message.get("content");
        }

        Map<String, Object> usageRaw = (Map<String, Object>) resp.get("usage");
        Map<String, Object> usage = new LinkedHashMap<>();
        if (usageRaw != null) {
            usage.put("promptTokens", usageRaw.get("prompt_tokens"));
            usage.put("completionTokens", usageRaw.get("completion_tokens"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("provider", "openai");
        result.put("model", model);
        result.put("usage", usage);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── Anthropic Claude Messages ─────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private ResponseEntity<ApiResponse<Map<String, Object>>> callClaude(
            Map<String, String> propMap, String model, String systemPrompt,
            List<Map<String, Object>> userMessages, int maxTokens) throws Exception {

        String apiKey = propMap.get("app.ai.claude.api-key");
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.ok(ApiResponse.error(400,
                    "API 키가 설정되지 않았습니다 (sy_prop: app.ai.claude.api-key)", null));
        }
        if (model == null || model.isBlank()) model = "claude-sonnet-4-6";

        Map<String, Object> reqBody = new LinkedHashMap<>();
        reqBody.put("model", model);
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            reqBody.put("system", systemPrompt);
        }
        reqBody.put("messages", userMessages);
        reqBody.put("max_tokens", maxTokens);

        String responseBody = RestClient.create()
                .post()
                .uri("https://api.anthropic.com/v1/messages")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("Content-Type", "application/json")
                .body(reqBody)
                .retrieve()
                .body(String.class);

        Map<String, Object> resp = objectMapper.readValue(responseBody, Map.class);

        String content = "";
        List<Map<String, Object>> contentList = (List<Map<String, Object>>) resp.get("content");
        if (contentList != null && !contentList.isEmpty()) {
            content = (String) contentList.get(0).get("text");
        }

        Map<String, Object> usageRaw = (Map<String, Object>) resp.get("usage");
        Map<String, Object> usage = new LinkedHashMap<>();
        if (usageRaw != null) {
            usage.put("promptTokens", usageRaw.get("input_tokens"));
            usage.put("completionTokens", usageRaw.get("output_tokens"));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("provider", "claude");
        result.put("model", model);
        result.put("usage", usage);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────────
    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }

    private static int toInt(Object v, int def) {
        if (v == null) return def;
        try { return ((Number) v).intValue(); } catch (Exception e) { return def; }
    }

    private static double toDouble(Object v, double def) {
        if (v == null) return def;
        try { return ((Number) v).doubleValue(); } catch (Exception e) { return def; }
    }
}
