package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMsgMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyI18nService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyI18nService {

    private final SyI18nService syI18nService;
    private final SyI18nMsgMapper syI18nMsgMapper;
    private final SyI18nMsgRepository syI18nMsgRepository;

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public SyI18nDto getById(String id) {
        SyI18nDto result = syI18nService.getById(id);
        if (result == null) throw new CmBizException("존재하지 않는 다국어 키입니다: " + id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyI18nDto> getList(Map<String, Object> p) {
        return syI18nService.getList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyI18nDto> getPageData(Map<String, Object> p) {
        return syI18nService.getPageData(p);
    }

    /** create — 생성 */
    @Transactional
    public SyI18n create(SyI18n body) {
        return syI18nService.create(body);
    }

    /** save — 저장 */
    @Transactional
    public SyI18n save(SyI18n body) {
        return syI18nService.save(body);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        syI18nService.delete(id);
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
            Map<String, Object> p = new HashMap<>();
            p.put("i18nId", i18nId);
            p.put("langCd", langCd);
            List<SyI18nMsgDto> existing = syI18nMsgMapper.selectList(p);

            if (!existing.isEmpty()) {
                SyI18nMsgDto dto = existing.get(0);
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
    }
}
