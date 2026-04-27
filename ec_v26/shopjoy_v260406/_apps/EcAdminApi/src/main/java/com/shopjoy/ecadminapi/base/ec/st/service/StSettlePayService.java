package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettlePayMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettlePayRepository;
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

@Service
@RequiredArgsConstructor
public class StSettlePayService {


    private final StSettlePayMapper mapper;
    private final StSettlePayRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StSettlePayDto getById(String id) {
        StSettlePayDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StSettlePayDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettlePayDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StSettlePayDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StSettlePay entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettlePay create(StSettlePay entity) {
        entity.setSettlePayId(CmUtil.generateId("st_settle_pay"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay result = repository.save(entity);
        return result;
    }

    @Transactional
    public StSettlePay save(StSettlePay entity) {
        if (!repository.existsById(entity.getSettlePayId()))
            throw new CmBizException("존재하지 않는 StSettlePay입니다: " + entity.getSettlePayId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StSettlePay entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
