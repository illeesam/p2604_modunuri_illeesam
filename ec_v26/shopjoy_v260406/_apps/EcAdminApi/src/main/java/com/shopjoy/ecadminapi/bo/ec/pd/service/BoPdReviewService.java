package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class BoPdReviewService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PdReviewMapper mapper;
    private final PdReviewRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PdReviewDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PdReviewDto getById(String id) {
        PdReviewDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PdReview create(PdReview body) {
        body.setReviewId("RV" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        return repository.save(body);
    }

    @Transactional
    public PdReviewDto update(String id, PdReview body) {
        PdReview entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public PdReviewDto changeStatus(String id, String statusCd) {
        PdReview entity = repository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setReviewStatusCdBefore(entity.getReviewStatusCd());
        entity.setReviewStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        em.flush();
        return getById(id);
    }
}
