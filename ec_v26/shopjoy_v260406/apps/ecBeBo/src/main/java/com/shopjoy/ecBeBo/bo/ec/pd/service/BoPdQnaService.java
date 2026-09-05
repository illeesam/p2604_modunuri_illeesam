package com.shopjoy.ecBeBo.bo.ec.pd.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdQnaAnswerDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdQnaRepository;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdQnaService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecBeBo.common.util.CmUtil;

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

    /* 키조회 */
    public PdProdQnaDto.Item getById(String id) { return pdProdQnaService.getById(id); }
    /* 목록조회 */
    public List<PdProdQnaDto.Item> getList(PdProdQnaDto.Request req) { return pdProdQnaService.getList(req); }
    /* 페이지조회 */
    public BasePage<PdProdQnaDto.Item> getPageData(PdProdQnaDto.Request req) { return pdProdQnaService.getPageData(req); }

    @Transactional public PdProdQna create(PdProdQna body) { return pdProdQnaService.create(body); }
    @Transactional public PdProdQna update(String id, PdProdQna body) { return pdProdQnaService.update(id, body); }
    @Transactional public void delete(String id) { pdProdQnaService.delete(id); }
    @Transactional public void saveListBase(List<PdProdQna> rows) { pdProdQnaService.saveListBase(rows); }

    /** saveAnswer — Q&A 답변 저장 */
    @Transactional
    public PdProdQnaDto.Item saveAnswer(String id, PdProdQnaAnswerDto.Request req) {
        // [쿼리 메서드] 상품문의 단건 조회
        PdProdQna entity = pdProdQnaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setAnswContent(req.getAnswContent());
        entity.setAnswDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 상품문의 저장
        PdProdQna saved = pdProdQnaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pdProdQnaService.getById(id);
    }
}
