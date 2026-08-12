package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nService;
import com.shopjoy.ecadminapi.cache.redisstore.SyI18nRedisStore;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyI18nService {

    private final SyI18nService syI18nService;
    private final SyI18nMsgRepository syI18nMsgRepository;
    private final SyI18nRedisStore i18nCache;

    /* 키조회 */
    public SyI18nDto.Item getById(String id) { return syI18nService.getById(id); }
    /* 목록조회 */
    public List<SyI18nDto.Item> getList(SyI18nDto.Request req) { return syI18nService.getList(req); }
    /* 페이지조회 */
    public BasePage<SyI18nDto.Item> getPageData(SyI18nDto.Request req) { return syI18nService.getPageData(req); }

    /* 등록 */
    @Transactional
    public SyI18n create(SyI18n body) {
        SyI18n saved = syI18nService.create(body);
        i18nCache.evictAll();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyI18n update(String id, SyI18n body) {
        SyI18n saved = syI18nService.update(id, body);
        i18nCache.evictAll();
        return saved;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        syI18nService.delete(id);
        i18nCache.evictAll();
    }

    /**
     * 다국어 메시지 일괄 저장 — sy_i18n 의 언어별 컬럼에 직접 반영
     *
     * 2026-08-13: sy_i18n_msg(행 방식) → sy_i18n 언어컬럼(ko/en/cn/ja)으로 통합.
     * 요청 형태({"msgs":{"ko":"...","en":"..."}})는 프론트 호환을 위해 그대로 유지한다.
     * 지원하지 않는 언어코드는 조용히 무시한다(잘못된 키로 컬럼이 늘지 않게).
     */
    @Transactional
    public void saveMsgs(String i18nId, Map<String, String> msgs) {
        SyI18n patch = new SyI18n();
        msgs.forEach((langCd, msgText) -> {
            switch (langCd == null ? "" : langCd) {
                case "ko" -> patch.setI18nMsgKo(msgText);
                case "en" -> patch.setI18nMsgEn(msgText);
                case "cn" -> patch.setI18nMsgCn(msgText);
                case "ja" -> patch.setI18nMsgJa(msgText);
                default   -> { /* 미지원 언어 — 무시 */ }
            }
        });
        syI18nService.update(i18nId, patch);
        i18nCache.evictAll();
    }
}
