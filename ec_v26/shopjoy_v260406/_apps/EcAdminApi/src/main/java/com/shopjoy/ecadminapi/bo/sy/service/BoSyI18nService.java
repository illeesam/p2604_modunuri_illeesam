package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMsgMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nService;
import com.shopjoy.ecadminapi.cache.redisstore.SyI18nRedisStore;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyI18nService {

    private final SyI18nService syI18nService;
    private final SyI18nMsgMapper syI18nMsgMapper;
    private final SyI18nMsgRepository syI18nMsgRepository;
    private final SyI18nRedisStore i18nCache;

    public SyI18nDto.Item getById(String id) { return syI18nService.getById(id); }
    public List<SyI18nDto.Item> getList(SyI18nDto.Request req) { return syI18nService.getList(req); }
    public SyI18nDto.PageResponse getPageData(SyI18nDto.Request req) { return syI18nService.getPageData(req); }

    @Transactional
    public SyI18n create(SyI18n body) {
        SyI18n saved = syI18nService.create(body);
        i18nCache.evictAll();
        return saved;
    }

    @Transactional
    public SyI18n update(String id, SyI18n body) {
        SyI18n saved = syI18nService.update(id, body);
        i18nCache.evictAll();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        syI18nService.delete(id);
        i18nCache.evictAll();
    }

    /**
     * 다국어 메시지 일괄 저장 — 언어코드별 upsert
     * 기존 메시지가 있으면 UPDATE, 없으면 INSERT
     */
    @Transactional
    public void saveMsgs(String i18nId, Map<String, String> msgs) {
        String updBy = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        msgs.forEach((langCd, msgText) -> {
            SyI18nMsgDto.Request req = new SyI18nMsgDto.Request();
            req.setI18nId(i18nId);
            req.setLangCd(langCd);
            List<SyI18nMsgDto.Item> existing = syI18nMsgMapper.selectList(req);

            if (!existing.isEmpty()) {
                SyI18nMsgDto.Item dto = existing.get(0);
                SyI18nMsg entity = new SyI18nMsg();
                entity.setI18nMsgId(dto.getI18nMsgId());
                entity.setI18nId(i18nId);
                entity.setLangCd(langCd);
                entity.setI18nMsg(msgText);
                entity.setUpdBy(updBy);
                entity.setUpdDate(now);
                syI18nMsgRepository.save(entity);
            } else {
                SyI18nMsg entity = new SyI18nMsg();
                entity.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
                entity.setI18nId(i18nId);
                entity.setLangCd(langCd);
                entity.setI18nMsg(msgText);
                entity.setRegBy(updBy);
                entity.setRegDate(now);
                entity.setUpdBy(updBy);
                entity.setUpdDate(now);
                syI18nMsgRepository.save(entity);
            }
        });
        i18nCache.evictAll();
    }
}
