package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaAnswerDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdQnaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdQnaService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 상품 Q&A 서비스 — base PdProdQnaService 위임 (thin wrapper) + saveAnswer.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdQnaService {

    private final PdProdQnaService pdProdQnaService;
    private final PdProdQnaRepository pdProdQnaRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdQnaDto.Item getById(String id) { return pdProdQnaService.getById(id); }
    public List<PdProdQnaDto.Item> getList(PdProdQnaDto.Request req) { return pdProdQnaService.getList(req); }
    public PdProdQnaDto.PageResponse getPageData(PdProdQnaDto.Request req) { return pdProdQnaService.getPageData(req); }

    @Transactional public PdProdQna create(PdProdQna body) { return pdProdQnaService.create(body); }
    @Transactional public PdProdQna update(String id, PdProdQna body) { return pdProdQnaService.update(id, body); }
    @Transactional public void delete(String id) { pdProdQnaService.delete(id); }
    @Transactional public void saveList(List<PdProdQna> rows) { pdProdQnaService.saveList(rows); }

    /** saveAnswer — Q&A 답변 저장 */
    @Transactional
    public PdProdQnaDto.Item saveAnswer(String id, PdProdQnaAnswerDto.Request req) {
        PdProdQna entity = pdProdQnaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setAnswContent(req.getAnswContent());
        entity.setAnswDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdQna saved = pdProdQnaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pdProdQnaService.getById(id);
    }
}
