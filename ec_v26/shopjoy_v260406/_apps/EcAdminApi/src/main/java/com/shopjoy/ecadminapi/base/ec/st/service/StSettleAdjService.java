package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleAdjMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleAdjRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class StSettleAdjService {


    private final StSettleAdjMapper mapper;
    private final StSettleAdjRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StSettleAdjDto getById(String id) {
        StSettleAdjDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StSettleAdjDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettleAdjDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StSettleAdjDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StSettleAdj entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettleAdj create(StSettleAdj entity) {
        entity.setSettleAdjId(CmUtil.generateId("st_settle_adj"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleAdj result = repository.save(entity);
        return result;
    }

    @Transactional
    public StSettleAdj save(StSettleAdj entity) {
        if (!repository.existsById(entity.getSettleAdjId()))
            throw new CmBizException("존재하지 않는 StSettleAdj입니다: " + entity.getSettleAdjId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleAdj result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StSettleAdj entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
